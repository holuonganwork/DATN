import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Read-only audit of source datasets; writes only to the selected output folder.
const args = process.argv.slice(2);
function option(name, fallback) { const i=args.indexOf(name); return i<0?fallback:args[i+1]; }
const jsonDir=path.resolve(option('--json-dir','rag_output_last_3000'));
const mdDir=path.resolve(option('--markdown-dir','md_rag_output_last_3000'));
const outDir=path.resolve(option('--output-dir','analysis'));
const asOf=option('--as-of','2026-10-23');
const decoder=new TextDecoder('utf-8',{fatal:true});
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
const normalize=text=>String(text??'').replace(/\r\n?/g,'\n').trim();
const flat=text=>normalize(text).replace(/\s+/g,' ').toLowerCase();
const hasValue=v=>v!==null&&v!==undefined&&v!==''&&(!Array.isArray(v)||v.length>0)&&(typeof v!=='object'||Array.isArray(v)||Object.keys(v).length>0);
const increment=(object,key,n=1)=>{object[key]=(object[key]||0)+n;};
const group=(items,key)=>{const result={};for(const item of items)increment(result,typeof key==='function'?key(item):item[key]);return result;};
const top=(object,n=15)=>Object.entries(object).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,n).map(([value,count])=>({value,count}));
function stats(values){
  const a=values.filter(Number.isFinite).sort((a,b)=>a-b);
  const quantile=p=>a.length?a[Math.floor((a.length-1)*p)]:null;
  return {n:a.length,min:a[0]??null,p10:quantile(.1),p25:quantile(.25),median:quantile(.5),p75:quantile(.75),p90:quantile(.9),p95:quantile(.95),p99:quantile(.99),max:a.at(-1)??null,mean:a.length?Number((a.reduce((s,x)=>s+x,0)/a.length).toFixed(2)):null,total:a.reduce((s,x)=>s+x,0)};
}
function urlInfo(value){
  if(typeof value!=='string'||!value.trim())return {present:false,valid:false};
  try{const u=new URL(value);return {present:true,valid:['https:','http:'].includes(u.protocol),host:u.hostname,canonical:u.origin+u.pathname+u.search};}catch{return {present:true,valid:false};}
}
function extractCode(text){
  const blocks=[];let open=null;
  for(const line of normalize(text).split('\n')){
    const match=line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if(!match){if(open)open.lines++;continue;}
    if(!open){open={mark:match[1][0],length:match[1].length,language:match[2].trim().toLowerCase()||'(unlabelled)',lines:0};}
    else if(match[1][0]===open.mark&&match[1].length>=open.length&&!match[2].trim()){blocks.push(open);open=null;}
    else open.lines++;
  }
  return {blocks,unclosed:Boolean(open)};
}
function duplicates(records,key){
  const buckets=new Map();
  for(const r of records){const value=r[key];if(value){if(!buckets.has(value))buckets.set(value,[]);buckets.get(value).push(r.id);}}
  const groups=[...buckets.values()].filter(x=>x.length>1).sort((a,b)=>b.length-a.length||a[0]-b[0]);
  return {groups:groups.length,records:groups.reduce((s,x)=>s+x.length,0),extra_records:groups.reduce((s,x)=>s+x.length-1,0),examples:groups.slice(0,20)};
}
const files=fs.readdirSync(jsonDir).filter(f=>f.endsWith('.json')).sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
const mdFiles=fs.readdirSync(mdDir).filter(f=>f.endsWith('.md'));
const records=[],errors=[],fieldCoverage={},sourceHosts={},contentLinkHosts={},blockLanguages={},metadataDisagreements=[];
const jsonFingerprint=crypto.createHash('sha256'),mdFingerprint=crypto.createHash('sha256');
let jsonBytes=0,mdBytes=0;
console.log(`Auditing ${files.length} JSON and ${mdFiles.length} Markdown files.`);
for(let i=0;i<files.length;i++){
  const filename=files[i], raw=fs.readFileSync(path.join(jsonDir,filename));jsonBytes+=raw.length;
  jsonFingerprint.update(filename+':'+hash(raw)+'\n');
  let json;
  try{json=JSON.parse(decoder.decode(raw).replace(/^\uFEFF/,''));}catch(error){errors.push({file:filename,error:String(error)});continue;}
  if(!json||Array.isArray(json)||typeof json!=='object'){errors.push({file:filename,error:'Expected JSON object'});continue;}
  for(const [key,value]of Object.entries(json)){
    const entry=fieldCoverage[key]??={present:0,nonempty:0,null:0,zero:0,false:0,types:{}};
    entry.present++;if(hasValue(value))entry.nonempty++;if(value===null)entry.null++;if(value===0)entry.zero++;if(value===false)entry.false++;
    increment(entry.types,Array.isArray(value)?'array':value===null?'null':typeof value);
  }
  const content=typeof json.content==='string'?json.content:'';
  const title=typeof json.title==='string'?json.title:'';
  const code=extractCode(content), source=urlInfo(json.source_link),github=urlInfo(json.github_link),pdf=urlInfo(json.pdf_link);
  if(source.valid)increment(sourceHosts,source.host);
  const links=[...content.matchAll(/https?:\/\/[^\s<>"\])]+/g)].map(m=>m[0]);
  for(const link of links){const info=urlInfo(link);if(info.valid)increment(contentLinkHosts,info.host);}
  for(const block of code.blocks)increment(blockLanguages,block.language);
  const tags=Array.isArray(json.issues_issuetagscore)?json.issues_issuetagscore:[];
  const words=content.match(/[\p{L}\p{N}_]+/gu)||[];
  const images=[...content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(m=>m[1]);
  const r={
    id:json.id,file:filename,filename_id_matches:String(json.id)===filename.replace(/^finding_/,'').replace(/\.json$/,''),
    impact:json.impact,kind:json.kind,title,firm:json.firm_name,protocol:json.protocol_name,protocol_id:json.protocol_id,auditfirm_id:json.auditfirm_id,
    report_date:json.report_date,chars:content.length,words:words.length,bytes:raw.length,title_chars:title.length,
    content_hash:hash(content),normalized_content_hash:content.trim()?hash(flat(content)):null,normalized_title:flat(title),
    source:json.source_link,source_valid:source.valid,source_canonical:source.canonical??null,
    github_field_present:github.present,github_field_valid:github.valid,pdf_field_present:pdf.present,pdf_field_valid:pdf.valid,
    any_github_link:/https:\/\/github\.com\//i.test(content),github_blob_link:/https:\/\/github\.com\/[^/\s)]+\/[^/\s)]+\/blob\//i.test(content),
    pinned_github_blob:/https:\/\/github\.com\/[^/\s)]+\/[^/\s)]+\/blob\/[a-f0-9]{40}\//i.test(content),
    github_commit_link:/https:\/\/github\.com\/[^/\s)]+\/[^/\s)]+\/commit\/[a-f0-9]{7,40}/i.test(content),
    hash40_mention:/\b[a-f0-9]{40}\b/i.test(content),sol_file_reference:/[\w./-]+\.sol\b/.test(content),
    solidity_fence_marker:/(?:^|\n)[ \t]*```[ \t]*solidity\b/i.test(content),code_blocks:code.blocks.length,unclosed_fence:code.unclosed,
    code_lines:code.blocks.reduce((s,b)=>s+b.lines,0),languages:[...new Set(code.blocks.map(b=>b.language))],
    poc_marker:/\bproof[ -]of[ -]concept\b|\bpoc\b/i.test(content),
    recommendation_marker:/\brecommendation[s]?\b|\bmitigation[s]?\b|\bremediation\b/i.test(content),
    root_cause_marker:/\broot cause\b/i.test(content),impact_marker:/\bimpact\b/i.test(content),
    update_marker:/\*\*Update\*\*|^#{1,6}\s*(?:update|resolution|status)\b/im.test(content),
    fixed_client_marker:/Marked as ["']Fixed["']|\bstatus\s*:\s*fixed\b|^#{1,6}\s*(?:\w+\s+)?(?:resolution|status)\s*\n+\s*fixed\b/im.test(content),
    acknowledged_marker:/\backnowledged\b/i.test(content),
    defivault_keywords:/\bvault\b|\bshares\b|\bstaking\b|\breward\b|\blending\b|\bliquidat(?:ion|e)\b|\boracle\b|\bAMM\b|\bliquidity\b/i.test(title+'\n'+content),
    markdown_images:images.length,relative_images:images.filter(x=>!/^https?:|^data:/i.test(x)).length,
    html_image:/<img\b/i.test(content),html_tags:/<\/?(?:div|p|br|span|img|table|tr|td|ul|li|code|pre)\b/i.test(content),
    replacement_char:content.includes('\uFFFD'),nul:content.includes('\u0000'),
    unexpected_control_char:/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(content),
    ui_export_boilerplate:/Export to GitHub|Set external GitHub Repo|Export to Clipboard/.test(content),
    clearpage_macro:/\\clearpage\b/.test(content),
    possible_mojibake:/â€™|â€œ|â€|ï¿½|Ã¤|Ã©/.test(content),
    tag_count:tags.length,protocol_category_count:json.protocols_protocol?.protocols_protocolcategoryscore?.length??0,
    summary_nonempty:hasValue(json.summary),quality_score:json.quality_score,general_score:json.general_score,
    nested_firm_matches:json.firm_name===json.auditfirms_auditfirm?.name,nested_protocol_matches:json.protocol_name===json.protocols_protocol?.name,
    md_exists:false,md_content_exact:false,md_content_canonical_eol_exact:false,md_frontmatter:false,md_categories_empty:null,md_source_marker:false
  };
  const mdName=filename.replace(/\.json$/,'.md'),mdPath=path.join(mdDir,mdName);
  if(fs.existsSync(mdPath)){
    const mdRaw=fs.readFileSync(mdPath);mdBytes+=mdRaw.length;mdFingerprint.update(mdName+':'+hash(mdRaw)+'\n');
    try{
      const mdDecoded=decoder.decode(mdRaw);
      r.md_double_crlf=/\r\r\n/.test(mdDecoded);
      const md=normalize(mdDecoded);r.md_exists=true;r.md_source_marker=md.includes('**Source:**');
      const front=md.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);r.md_frontmatter=Boolean(front);
      if(front){
        const metadata={};for(const line of front[1].split('\n')){const m=line.match(/^([\w_]+):\s*(.*)$/);if(m)metadata[m[1]]=m[2];}
        r.md_categories_empty=metadata.categories==='[]';
        for(const [mdKey,jsonValue]of [['severity',json.impact],['protocol',json.protocol_name],['firm',json.firm_name],['date',String(json.report_date??'').slice(0,10)]]){
          const value=(metadata[mdKey]??'').replace(/^"(.*)"$/,'$1').replace(/^'(.*)'$/,'$1');
          if(value!==String(jsonValue??''))metadataDisagreements.push({id:r.id,field:mdKey,json:jsonValue,markdown:value});
        }
        if(metadata.title?.startsWith('"')){try{r.md_title_exact=JSON.parse(metadata.title)===title;}catch{r.md_title_exact=false;r.md_title_quote_parse_error=true;}}
        else r.md_title_exact=metadata.title===title;
        r.md_plain_scalar_colon_space=Object.entries(metadata).some(([key,value])=>['protocol','firm'].includes(key)&&!/^['"]/.test(value)&&/:\s/.test(value));
        r.md_title_backslash_escape=metadata.title?.includes('\\')??false;
      }
      // Strip only the first wrapper heading. Content itself may contain a
      // heading with the same text and must remain byte-for-byte intact.
      const bodyMarker=md.match(/\n## Vulnerability Details[ \t]*\n/);
      const body=bodyMarker?md.slice(bodyMarker.index+bodyMarker[0].length):'';
      r.md_content_exact=normalize(body)===normalize(content);
      // Check raw source with a second, explicit canonicalization for Windows
      // double-CRLF produced by newline translation; do not edit source data.
      const canonicalEol=text=>String(text).replace(/\r+\n/g,'\n').replace(/\r/g,'\n').trim();
      const canonicalMd=canonicalEol(mdDecoded);
      const canonicalMarker=canonicalMd.match(/\n## Vulnerability Details[ \t]*\n/);
      r.md_content_canonical_eol_exact=Boolean(canonicalMarker)&&canonicalEol(canonicalMd.slice(canonicalMarker.index+canonicalMarker[0].length))===canonicalEol(content);
      r.md_body_extracted=Boolean(body);
      r.md_hash=hash(mdRaw);
    }catch(error){errors.push({file:mdName,error:String(error)});}
  }
  records.push(r);
  if((i+1)%1000===0)console.log(`Processed ${i+1}/${files.length}`);
}
const flags=['filename_id_matches','source_valid','github_field_present','github_field_valid','pdf_field_present','pdf_field_valid','any_github_link','github_blob_link','pinned_github_blob','github_commit_link','hash40_mention','sol_file_reference','solidity_fence_marker','unclosed_fence','poc_marker','recommendation_marker','root_cause_marker','impact_marker','update_marker','fixed_client_marker','acknowledged_marker','defivault_keywords','html_image','html_tags','replacement_char','nul','unexpected_control_char','ui_export_boilerplate','clearpage_macro','possible_mojibake','summary_nonempty','nested_firm_matches','nested_protocol_matches','md_exists','md_content_exact','md_content_canonical_eol_exact','md_frontmatter','md_source_marker','md_title_exact','md_title_quote_parse_error','md_double_crlf','md_plain_scalar_colon_space','md_title_backslash_escape'];
const allFlags=Object.fromEntries(flags.map(f=>[f,records.filter(r=>r[f]).length]));
const perFirm=top(group(records,'firm'),100).map(f=>({firm:f.value,count:f.count,impacts:group(records.filter(r=>r.firm===f.value),'impact')}));
const dates=records.map(r=>r.report_date).filter(d=>typeof d==='string'&&Number.isFinite(Date.parse(d))).sort();
const protocolNames=group(records,'protocol'),protocolIds=group(records,'protocol_id');
const sourceGroups=new Map();for(const r of records){if(r.source_canonical){if(!sourceGroups.has(r.source_canonical))sourceGroups.set(r.source_canonical,[]);sourceGroups.get(r.source_canonical).push(r);}}
const sourceLargest=[...sourceGroups.entries()].sort((a,b)=>b[1].length-a[1].length).slice(0,10).map(([url,list])=>({url,count:list.length,protocols:[...new Set(list.map(r=>r.protocol))]}));
const idSet=new Set(records.map(r=>r.id));
const manifestCandidates=new Map();
const add=(r,reason)=>{if(!r)return;const current=manifestCandidates.get(r.id);if(current)current.reasons.push(reason);else manifestCandidates.set(r.id,{id:r.id,title:r.title,firm:r.firm,impact:r.impact,chars:r.chars,reasons:[reason],json_file:path.relative(process.cwd(),path.join(jsonDir,r.file)).replaceAll('\\','/'),markdown_file:path.relative(process.cwd(),path.join(mdDir,r.file.replace('.json','.md'))).replaceAll('\\','/')});};
for(const f of perFirm){const candidates=records.filter(r=>r.firm===f.firm).sort((a,b)=>a.chars-b.chars);add(candidates[Math.floor(candidates.length/2)],'firm_median_length');}
for(const r of [...records].sort((a,b)=>a.chars-b.chars).slice(0,5))add(r,'shortest');
for(const r of [...records].sort((a,b)=>b.chars-a.chars).slice(0,3))add(r,'longest');
for(const [flag,count]of [['unclosed_fence',2],['html_tags',2],['pinned_github_blob',2],['tag_count',3],['relative_images',2],['possible_mojibake',2]])for(const r of records.filter(r=>r[flag]).slice(0,count))add(r,flag);
for(const impact of ['HIGH','MEDIUM','LOW','GAS'])add(records.filter(r=>r.impact===impact).sort((a,b)=>a.id-b.id)[0],'impact_'+impact);
const dupNormalized=duplicates(records,'normalized_content_hash');
for(const ids of dupNormalized.examples.slice(0,3))for(const id of ids.slice(0,2))add(records.find(r=>r.id===id),'normalized_duplicate');
const nearPairs=[];
const titleGroups=new Map();
for(const r of records){if(!titleGroups.has(r.normalized_title))titleGroups.set(r.normalized_title,[]);titleGroups.get(r.normalized_title).push(r);}
const shingles=r=>{
  const json=JSON.parse(fs.readFileSync(path.join(jsonDir,r.file),'utf8'));
  const tokens=flat(json.content).match(/[\p{L}\p{N}_]+/gu)||[];const result=new Set();
  for(let i=0;i+4<tokens.length;i++)result.add(tokens.slice(i,i+5).join(' '));return result;
};
let sameTitlePairs=0;
for(const list of titleGroups.values()){
  if(list.length<2||list.length>100)continue;
  const sets=new Map(list.map(r=>[r.id,shingles(r)]));
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
    sameTitlePairs++;const a=list[i],b=list[j];if(a.normalized_content_hash===b.normalized_content_hash)continue;
    const sa=sets.get(a.id),sb=sets.get(b.id);if(!sa.size||!sb.size)continue;
    let intersection=0;for(const s of sa)if(sb.has(s))intersection++;
    const score=intersection/(sa.size+sb.size-intersection);
    if(score>=.8)nearPairs.push({a:a.id,b:b.id,jaccard:Number(score.toFixed(4)),title:a.title});
  }
}
nearPairs.sort((a,b)=>b.jaccard-a.jaccard);
for(const pair of nearPairs.slice(0,3)){add(records.find(r=>r.id===pair.a),'same_title_near_duplicate');add(records.find(r=>r.id===pair.b),'same_title_near_duplicate');}
const summary={
  schema_version:1,as_of:asOf,json_directory:path.relative(process.cwd(),jsonDir).replaceAll('\\','/'),markdown_directory:path.relative(process.cwd(),mdDir).replaceAll('\\','/'),
  fingerprint_method:'sha256 of naturally sorted filename:sha256(raw bytes) lines',json_fingerprint:jsonFingerprint.digest('hex'),markdown_fingerprint:mdFingerprint.digest('hex'),
  input_files:{json:files.length,markdown:mdFiles.length,json_bytes:jsonBytes,markdown_paired_bytes:mdBytes},parsed_records:records.length,errors,
  unique_ids:idSet.size,duplicate_ids:records.length-idSet.size,id_min:Math.min(...records.map(r=>r.id)),id_max:Math.max(...records.map(r=>r.id)),
  orphan_markdown_files:mdFiles.filter(f=>!files.includes(f.replace(/\.md$/,'.json'))),
  impacts:group(records,'impact'),kinds:group(records,'kind'),firm_count:perFirm.length,protocol_name_count:Object.keys(protocolNames).length,protocol_id_count:Object.keys(protocolIds).length,
  fields:fieldCoverage,flags:allFlags,per_firm:perFirm,top_protocols:top(protocolNames,15),top_source_hosts:top(sourceHosts,20),top_body_link_hosts:top(contentLinkHosts,15),
  unique_source_urls:sourceGroups.size,source_largest_groups:sourceLargest,
  lengths:{content_chars:stats(records.map(r=>r.chars)),content_words:stats(records.map(r=>r.words)),code_lines:stats(records.map(r=>r.code_lines))},
  length_buckets:{under_200:records.filter(r=>r.chars<200).length,under_500:records.filter(r=>r.chars<500).length,over_8000:records.filter(r=>r.chars>8000).length,over_16000:records.filter(r=>r.chars>16000).length,over_32000:records.filter(r=>r.chars>32000).length},
  dates:{min:dates[0],max:dates.at(-1),invalid_or_missing:records.length-dates.length,future_as_of:records.filter(r=>r.report_date&&String(r.report_date).slice(0,10)>asOf).length,per_year:group(records,r=>String(r.report_date??'MISSING').slice(0,4))},
  code:{with_blocks:records.filter(r=>r.code_blocks>0).length,total_blocks:records.reduce((s,r)=>s+r.code_blocks,0),languages:top(blockLanguages,30),language_record_counts:top(group(records.flatMap(r=>r.languages.map(language=>({language}))),'language'),30),unclosed_ids:records.filter(r=>r.unclosed_fence).map(r=>r.id)},
  images:{records:records.filter(r=>r.markdown_images>0).length,total:records.reduce((s,r)=>s+r.markdown_images,0),relative_image_records:records.filter(r=>r.relative_images>0).length,total_relative:records.reduce((s,r)=>s+r.relative_images,0)},
  tags:{records_with_tags:records.filter(r=>r.tag_count>0).length,records_with_protocol_categories:records.filter(r=>r.protocol_category_count>0).length,md_empty_categories:records.filter(r=>r.md_categories_empty===true).length,examples:records.filter(r=>r.tag_count>0).slice(0,6).map(r=>({id:r.id,raw:JSON.parse(fs.readFileSync(path.join(jsonDir,r.file),'utf8')).issues_issuetagscore}))},
  score_values:{quality:group(records,r=>String(r.quality_score)),general:group(records,r=>String(r.general_score))},
  duplicates:{exact_content:duplicates(records,'content_hash'),whitespace_case_normalized_content:dupNormalized,normalized_titles:duplicates(records,'normalized_title'),same_title_pairs_checked:sameTitlePairs,near_pairs_same_title:nearPairs},
  conversion:{metadata_disagreements:metadataDisagreements,body_mismatch_ids:records.filter(r=>r.md_exists&&!r.md_content_exact).map(r=>r.id),title_mismatch_ids:records.filter(r=>!r.md_title_exact).map(r=>r.id)},
  review_candidate_count:manifestCandidates.size,
  notes:['Flags based on regex are retrieval/inspection signals, not semantic verification or confirmed labels.','Near duplicates only checked among identical normalized titles with five-word shingle Jaccard >= 0.8; cross-title duplicates not exhaustively searched.','URLs were parsed, not requested; valid URL syntax does not imply reachability, authenticity, licensing, or correct vulnerable commit.','Character/word counts are not model token counts. No LLM, embedding, compiler, or exploit was executed.']
};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'dataset_quality_summary.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'dataset_quality_records.jsonl'),records.map(r=>JSON.stringify(r)).join('\n')+'\n');
fs.writeFileSync(path.join(outDir,'dataset_review_candidates.json'),JSON.stringify([...manifestCandidates.values()],null,2)+'\n');
console.log(JSON.stringify({parsed:records.length,errors:errors.length,flags:allFlags,impacts:summary.impacts,lengths:summary.lengths.content_chars,duplicates:summary.duplicates.whitespace_case_normalized_content,near_pairs:nearPairs.length,conversion_mismatches:summary.conversion.body_mismatch_ids.length,review_candidates:manifestCandidates.size,output:outDir},null,2));
