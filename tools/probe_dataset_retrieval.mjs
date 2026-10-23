import fs from 'node:fs';
import path from 'node:path';

// Small lexical smoke test on known examples, NOT a held-out benchmark.
// No models, embeddings, translation services, or external APIs are called.
const directory=path.resolve('rag_output_last_3000');
const output=path.resolve('analysis/retrieval_smoke_test.json');
const stop=new Set('a an the and or in on at of to for from with as is are be by this that it its when can not into but if'.split(' '));
function tokenize(text){
  return (String(text).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(t=>t.length>1&&!stop.has(t));
}
const documents=fs.readdirSync(directory).filter(f=>f.endsWith('.json')).map(filename=>{
  const j=JSON.parse(fs.readFileSync(path.join(directory,filename),'utf8'));
  const tokens=tokenize(j.title+'\n'+j.content),frequency=new Map();
  for(const token of tokens)frequency.set(token,(frequency.get(token)||0)+1);
  return {id:j.id,title:j.title,protocol:j.protocol_name,length:tokens.length,frequency};
});
const df=new Map();for(const d of documents)for(const token of d.frequency.keys())df.set(token,(df.get(token)||0)+1);
const averageLength=documents.reduce((s,d)=>s+d.length,0)/documents.length;
function search(query){
  const tokens=[...new Set(tokenize(query))],k1=1.2,b=.75;
  return documents.map(d=>{
    let score=0;
    for(const token of tokens){const tf=d.frequency.get(token)||0;if(!tf)continue;const n=df.get(token)||0;const idf=Math.log(1+(documents.length-n+.5)/(n+.5));score+=idf*tf*(k1+1)/(tf+k1*(1-b+b*d.length/averageLength));}
    return {id:d.id,title:d.title,score:Number(score.toFixed(5))};
  }).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||a.id-b.id);
}
const tests=[
  {target:61058,en:'withdraw underlying assets rounding down fAmount shares small amount',vi:'làm tròn xuống khi rút tài sản nhưng cổ phần không giảm'},
  {target:62814,en:'reward rate zero pool last updated timestamp incentive schedule rewards excess',vi:'phần thưởng bị tính thừa do không cập nhật mốc thời gian của nhóm'},
  {target:61599,en:'oracle stale price publish time confidence interval automation fees',vi:'giá từ bộ cung cấp dữ liệu bị cũ do không kiểm tra thời gian công bố'},
  {target:62355,en:'NFT listing approval ownership creator ERC721 other user',vi:'người dùng tạo niêm yết tài sản của người khác vì chỉ kiểm tra quyền phê duyệt'},
  {target:61551,en:'bad debt insurance socialization last withdrawer insolvency',vi:'nợ xấu không được phân bổ khiến người rút tiền cuối cùng chịu lỗ'},
  {target:61415,en:'session key unbounded array removal gas block limit denial service',vi:'mảng khóa phiên không giới hạn làm thao tác xóa vượt giới hạn phí thực thi'}
];
const results=tests.map(test=>{
  const result={target:test.target};
  for(const language of ['en','vi']){const ranked=search(test[language]);const i=ranked.findIndex(r=>r.id===test.target);result[language]={query:test[language],target_rank:i<0?null:i+1,positive_score_results:ranked.length,top5:ranked.slice(0,5)};}
  return result;
});
const summary=Object.fromEntries(['en','vi'].map(language=>[language,{known_target_in_top5:results.filter(r=>r[language].target_rank&&r[language].target_rank<=5).length,queries:tests.length}]));
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({purpose:'Known-example BM25 smoke test; queries authored after reading these findings. Not an independent relevance benchmark, not corpus-wide Recall@5.',index:'title + content, no summary, raw content; camel/snake split; Unicode terms; small English stop list',parameters:{k1:1.2,b:.75},corpus_size:documents.length,summary,results},null,2)+'\n');
console.log(JSON.stringify({summary,ranks:results.map(r=>({target:r.target,en:r.en.target_rank,vi:r.vi.target_rank})),output},null,2));
