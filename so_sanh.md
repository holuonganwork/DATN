# So sánh hai đề tài đồ án trong 10 tuần

> Cập nhật ngày 23/10/2026. Căn cứ: hai mô tả ban đầu, dữ liệu trong workspace, tài liệu gốc được dẫn và thông tin bạn xác nhận. Chưa có nội dung các cuộc chat khác nên không gán nhận định cho những cuộc trao đổi đó.

**Khuyến nghị: chọn đề tài 1, thu hẹp vào một nhóm lỗi DeFi, lấy phát hiện finding có bằng chứng và đánh giá thực nghiệm làm trọng tâm.** Làm quy trình LLM có cấu trúc trước; thêm truy xuất báo cáo nếu kịp. Foundry có thể hỗ trợ kiểm tra một vài ca mà chưa cần xây Agent.

Lý do chính là mức độ kiểm soát công việc và khả năng giải thích, phù hợp việc bạn làm một mình, mới với bộ công cụ, ngân sách thấp và có 10 tuần. Đề tài 2 đáng làm khi có nền tảng hoặc vượt qua pilot sớm; tên “Agent” tự nó không làm đóng góp học thuật mạnh hơn.

Hai bản đề cương chi tiết: [đề tài 1 — README.md](README.md), [đề tài 2 — De_tai_phu.md](De_tai_phu.md).

## 1. Điều kiện lựa chọn đã biết

| Điều kiện bạn cung cấp | Hệ quả đối với lựa chọn |
|---|---|
| Làm một mình | Cần ít thành phần phụ thuộc nhau và có mốc cắt giảm |
| Khá mới với Solidity/DeFi/Foundry | Phải dành thời gian học và tự kiểm tra kết quả AI |
| Có thể làm toàn thời gian | Có thể đầu tư dữ liệu và thực nghiệm, nhưng vẫn cần thời gian viết luận văn |
| Ngân sách không cao | Ưu tiên một model, giới hạn token/lượt, chưa huấn luyện hoặc chạy nhiều model |
| Giảng viên yêu cầu hiểu và giải thích rõ bài toán | Đầu vào, đầu ra, nhãn đúng/sai và phạm vi kết luận quan trọng hơn số công nghệ |

Chưa biết số giờ cụ thể, cấu hình máy, mức tiền tối đa và rubric chính thức của bộ môn. Các kế hoạch giả định khoảng 35 giờ có tổ chức/tuần, tổng 350 giờ. Đây là giả định lập kế hoạch, không phải thông tin đã xác nhận. Chưa có yêu cầu bắt buộc huấn luyện model mới hoặc có phát hiện zero-day.

## 2. Hai đề tài khác nhau ở đâu?

| Khía cạnh | Đề tài 1: LLM hỗ trợ audit | Đề tài 2: Agent + phân tích tĩnh + Foundry |
|---|---|---|
| Câu hỏi trung tâm | Từ code và chức năng dự kiến, LLM đề xuất finding đúng tới đâu? | Vòng nhận phản hồi công cụ giúp tìm và xác nhận lỗi bằng PoC tới đâu? |
| Đầu vào chính | Code snapshot, mô tả nghiệp vụ; ví dụ tham khảo nếu bật truy xuất | Cùng loại đầu vào, thêm harness và ngữ cảnh tĩnh |
| Đầu ra | Finding có nguyên nhân, vị trí, điều kiện, tác động, khuyến nghị | Finding + PoC + trace + kết quả verifier |
| Cách điều khiển | Chương trình định trước các bước | Agent chọn hành động trong công cụ/quota cho phép |
| Chấm đúng/sai | Đối chiếu lỗi tham chiếu và kiểm tra lập luận | Vẫn phải đối chiếu finding; thêm kiểm tra kịch bản và oracle |
| Dữ liệu khó nhất | Nối báo cáo về code đúng phiên bản, tạo đối chứng | Tất cả phần bên trái + môi trường chạy và verifier từng ca |
| Lợi thế hiện có | 3.000 finding có thể lọc làm kho tri thức | Dùng được finding làm nguồn ứng viên; chưa có harness được xác nhận |
| Lỗi thường gặp của hệ thống | Nhận định nghe hợp lý nhưng sai điều kiện | Thêm test PASS giả, sai setup, sửa vòng lặp không hội tụ |
| Thành công tối thiểu | Pipeline tái lập + bộ ca đáng tin + so sánh chất lượng | Thêm vòng phản hồi ổn định và PoC được xác nhận độc lập |
| Cắt giảm khi chậm | Bỏ RAG/UI/bản vá, giữ bài toán đánh giá lõi | Bỏ Agent/PoC sẽ thay đổi đáng kể tên và mục tiêu đã đăng ký |

**Cùng dùng một nhóm lỗi vault thì đề tài 2 vẫn có nhiều việc hơn.** Không nên so một đề tài 1 “audit mọi loại smart contract” với đề tài 2 chỉ chạy vài ví dụ nhỏ rồi kết luận hướng nào dễ hơn. Khuyến nghị ở đây so hai phiên bản đã thu hẹp hợp lý.

## 3. Một ví dụ để thấy lượng công việc tăng thêm

Giả sử một vault có lỗi quy đổi tài sản sang cổ phần trong một tình huống biên. Đây là tình huống minh họa, không phải finding thực nghiệm của repository.

**Đề tài 1 cần làm:** hiểu quy tắc quy đổi; chỉ ra công thức và điều kiện gây sai; giải thích ai thiệt hại; đề xuất cách xử lý; kiểm tra nhận định có khớp lỗi tham chiếu. Nếu chưa chạy test, báo cáo phải ghi bằng chứng là phân tích code/phép tính.

**Đề tài 2 cần làm thêm:** dựng token và vault; tạo actor và tài sản ban đầu; sinh chuỗi giao dịch; xử lý approve, trạng thái và số nguyên; chạy PoC; đọc trace; sửa PoC khi thất bại; dùng verifier xác nhận tài sản/ nghĩa vụ trước-sau; ngăn thao túng setup; kiểm tra lại trên bản đã sửa.

Nếu PoC không chạy, phải phân biệt: nhận định sai, test viết sai, dependency hỏng, setup thiếu, oracle sai hay hết ngân sách. Những khả năng này làm thiết kế đánh giá phức tạp hơn. Chúng cũng tạo nội dung kỹ thuật tốt khi người thực hiện đã hiểu nền tảng.

## 4. Kiến thức phải tự nắm để bảo vệ

| Kiến thức | Đề tài 1 | Đề tài 2 |
|---|---|---|
| Solidity: state, function, modifier, call, số nguyên | Bắt buộc trong code đã chọn | Bắt buộc và phải viết/debug test |
| Nghiệp vụ DeFi | Hiểu dòng tiền, quyền, quy tắc trong từng ca | Thêm mô hình attacker, trạng thái và chuỗi thao tác |
| LLM: prompt, context, output schema, giới hạn | Bắt buộc | Bắt buộc, thêm hành động và phản hồi |
| Truy xuất tri thức/RAG | Nếu chọn làm thí nghiệm này | Không bắt buộc, có thể bỏ khỏi MVP |
| Phân tích tĩnh/Slither | Có thể là baseline hoặc mở rộng | Phải giải thích vai trò và giới hạn |
| Foundry/unit test | Học cơ bản để đối chiếu một số ca | Phải thành thạo đủ để dựng harness và chấm PoC |
| Oracle và mô hình đe dọa | Cần cho việc kết luận finding đúng | Cần thêm mã kiểm tra độc lập, tránh kết quả giả |
| Thực nghiệm | Tách tập, baseline, precision/recall, chấm giải thích | Thêm tỷ lệ PoC hợp lệ, lỗi runner, quota và đối chứng nhiều lượt |

Việc dùng công cụ AI hỗ trợ viết code không loại bỏ yêu cầu hiểu các hàng này. Với tiêu chí giảng viên đưa ra, một hệ thống nhỏ tự giải thích được có cơ sở bảo vệ tốt hơn một demo nhiều thành phần mà không biết kết quả đúng vì sao.

## 5. Dữ liệu hiện có giúp được đến đâu?

Kiểm kê cục bộ cho thấy 3.000 Markdown: 1.816 LOW, 688 MEDIUM, 460 HIGH, 36 GAS; 2.994 file có `categories: []`. Thống kê đầy đủ và giới hạn phép đếm ở [README](README.md).

Ba hệ quả quan trọng:

1. **Không phải bộ dữ liệu lỗi logic đã gán nhãn.** Cần lọc nội dung; không gộp gas optimization và lỗi bảo mật thành một lớp.
2. **Không phải bộ benchmark code đã sẵn sàng.** Code snippet và link GitHub chưa đảm bảo có đủ snapshot, bản sửa và nhãn đáng tin.
3. **Không phải 3.000 môi trường exploit.** Đề tài 2 cần thêm compiler, dependency, setup và verifier; lượng báo cáo nhiều chưa giải quyết nút thắt này.

Lợi thế thực của dữ liệu nghiêng về việc tìm ứng viên và xây kho tham khảo cho đề tài 1. Không cần fine-tune chỉ vì đã có 3.000 file. Một cặp để huấn luyện phát hiện thường cần đầu vào code/ngữ cảnh và đầu ra finding tương ứng, cùng tách tập đúng; hiện chưa xác nhận được cấu trúc đó.

Phải tách **kho tham khảo** khỏi **nhãn dùng chấm bài**. Nếu model được đọc báo cáo chứa đáp án của ca test thì kết quả không còn đo khả năng phát hiện độc lập. Chia theo project, nhóm code gần trùng và sự cố; không chia ngẫu nhiên từng đoạn báo cáo. Dữ liệu công khai còn có rủi ro model đã ghi nhớ từ trước, cần nêu như giới hạn của cả hai đề tài.

## 6. Chất lượng học thuật: điều gì quyết định?

| Một phiên bản yếu | Phiên bản đủ rõ để làm đồ án |
|---|---|
| Gọi API, xuất báo cáo đẹp | Có câu hỏi nghiên cứu, baseline, dữ liệu và chấm đúng/sai |
| Có RAG nên mặc định tốt hơn | Đo có/không truy xuất, phân tích khi truy xuất gây nhiễu |
| Gọi là Agent nên có tính mới | Nêu tác tử được chọn gì, vì sao phản hồi hữu ích và so cùng ngân sách |
| Test PASS nên lỗi đã được chứng minh | Verifier độc lập kiểm tra vi phạm với điều kiện hợp lệ |
| Chạy vài ca demo đẹp | Test set khóa trước, công bố cả thất bại và chi phí |
| Điểm thấp nên đổi ca cho cao hơn | Giữ phép đo, phân tích giới hạn và kết luận đúng với dữ liệu |

[LLM4Vuln](https://arxiv.org/abs/2401.16185v4), [GPTScan](https://arxiv.org/abs/2308.03314) và [PropertyGPT](https://arxiv.org/abs/2405.02580) cho thấy đã có nghiên cứu về tri thức, phân tích chương trình và sinh/kiểm tra thuộc tính với LLM. Đây là cơ sở chọn baseline và giới hạn tuyên bố tính mới; không phải bằng chứng rằng pipeline dự kiến của bạn sẽ đạt kết quả tương tự.

Đề tài 1 có thể có nội dung học thuật tốt nếu đánh giá chặt. Đề tài 2 có thể có chiều sâu hệ thống lớn hơn nếu verifier và thực nghiệm đúng. Không có đủ thông tin về rubric để hứa đề tài nào được điểm cao hơn.

## 7. Ma trận quyết định theo hoàn cảnh hiện tại

Điểm 1–5 dưới đây là **đánh giá chủ quan để lập kế hoạch**, 5 nghĩa là phù hợp hơn với hoàn cảnh hiện tại. Không phải điểm chất lượng tuyệt đối, xác suất hoàn thành hay kết quả khảo sát. Trọng số ưu tiên hoàn thành và giải thích rõ theo điều kiện của bạn.

| Tiêu chí | Trọng số | Đề tài 1 | Đề tài 2 | Căn cứ |
|---|---:|---:|---:|---|
| Kiểm soát tiến độ 10 tuần | 30% | 4 | 2 | Hướng 2 có chuỗi phụ thuộc harness → PoC → verifier → Agent |
| Dựng dữ liệu và đánh giá từ nguồn đang có | 20% | 4 | 3 | Cả hai phải lấy code; hướng 2 cần môi trường chạy riêng |
| Khả năng hiểu và giải thích bài toán | 20% | 4 | 4 | Cả hai rõ nếu thu hẹp; hướng 2 đòi nhiều kiến thức nền hơn |
| Độ thuyết phục của demo khi hoàn thành | 10% | 4 | 5 | PoC hợp lệ có bằng chứng trực quan về tác động |
| Độ sâu kỹ năng audit/kiểm thử tích lũy | 10% | 4 | 5 | Hướng 2 buộc làm thêm mô hình attacker và test |
| Kiểm soát ngân sách và vận hành | 10% | 4 | 2 | Ít vòng lặp và phụ thuộc thực thi hơn ở hướng 1 |
| **Điểm có trọng số** | **100%** | **4,0/5** | **3,2/5** | Chỉ dùng làm dụng cụ suy xét |

Điểm 4 cho khả năng giải thích của hướng 2 giả định bạn đã hiểu được harness; đây là điều phải kiểm tra trong pilot, không phải năng lực được mặc định sẵn. Nếu đã có người hướng dẫn kỹ thuật, harness ổn định và kinh nghiệm Foundry, các điểm tiến độ/dữ liệu/vận hành có thể tăng đáng kể. Ví dụ nâng ba điểm tương ứng của hướng 2 lên 4/4/3 thì tổng thành 4,1/5. Khuyến nghị do đó gắn với điểm xuất phát, không phải phủ nhận đề tài 2.

## 8. Khối lượng, quy mô và tiền

| Hạng mục dự kiến | Đề tài 1 thu gọn | Đề tài 2 thu gọn |
|---|---|---|
| Dữ liệu mục tiêu | 16 ca gốc, mỗi ca lỗi + đối chứng | 12 ca gốc, mỗi ca lỗi + đối chứng có harness |
| Development/test dự kiến | 4/12 ca gốc, ưu tiên tách project | 4/8 ca gốc, ưu tiên tách project |
| Cấu hình | A0 trực tiếp; A1 có cấu trúc; A2 thêm truy xuất | B0 trực tiếp; B1 thêm Slither; B2 Agent; B3 nhiều ứng viên độc lập |
| Lần lặp | Khoảng 3, chốt theo pilot/ngân sách | Khoảng 3, chốt theo pilot/ngân sách |
| Cuộc gọi chính theo thiết kế mục tiêu | 216 nếu A2 được triển khai | Tối đa 480 theo quota bốn cấu hình |
| Công phải làm ngoài gọi model | Thu thập/chấm finding, làm sạch truy xuất | Thêm dựng/debug harness, kiểm tra PoC và giới hạn runner |

Hai quy mô là kế hoạch khác nhau, không phải phép so sánh thành tích trên cùng benchmark. “Ca gốc” khác “đầu vào”: một ca có hai phiên bản; không coi chúng là hai dự án độc lập. Các số thực tế có thể đổi khi phải giữ toàn bộ ca của cùng project trong một tập.

Không thể tính tiền thật khi chưa chọn model và đo token. Cần ghi cả input, output, token suy luận có tính phí nếu có, retry và development. Số cuộc gọi ít hơn không luôn rẻ hơn nếu context dài hơn. Công thức và ví dụ giá **giả định** ở [đề tài 1](README.md); không coi ví dụ là báo giá.

Với ngân sách thấp, nên ưu tiên dữ liệu/đánh giá hơn giao diện, dùng một model, một kiểu truy xuất đơn giản, chạy local và chưa mua GPU. Nếu hướng 2 cần fork lịch sử, khả năng RPC và tiền dịch vụ là biến số phải kiểm tra trước, không mặc định có sẵn.

## 9. Lộ trình nên chọn cho bạn

### Lõi bắt buộc: đề tài 1

Đăng ký tên: **“Xây dựng và đánh giá hệ thống hỗ trợ rà soát smart contract Solidity bằng mô hình ngôn ngữ lớn với quy trình phân tích có cấu trúc.”**

Một nhóm lỗi ban đầu: kế toán tài sản/cổ phần ở vault nhỏ. Đầu vào có code và mô tả chức năng; đầu ra là finding có bằng chứng. So A0/A1 là lõi, A2 truy xuất là mở rộng có kế hoạch. Không hứa sửa tự động hoặc audit toàn giao thức.

Ba câu cần viết vào đề cương:

1. **Bài toán:** hỗ trợ tìm và giải thích lỗi thuộc phạm vi đã chọn từ mã nguồn cùng yêu cầu nghiệp vụ.
2. **Phương pháp:** đối chiếu LLM trực tiếp với hướng dẫn có cấu trúc; khảo sát thêm tri thức truy xuất nếu đủ điều kiện.
3. **Đánh giá:** phát hiện đúng/báo sai, chất lượng giải thích, chi phí và giới hạn trên bộ ca tách theo project.

### Bậc mở rộng thứ nhất: thêm bằng chứng, giữ nguyên trọng tâm

Nếu pipeline và dữ liệu đã ổn trước cuối tuần 6, kiểm tra thủ công khoảng 2–3 finding tiêu biểu bằng Foundry. Dùng chúng giải thích tác động và minh họa giới hạn. Ghi rõ là người làm dựng test; không tính là Agent tự sinh PoC hoặc thổi phồng tỷ lệ xác nhận tự động.

### Bậc tiếp theo: Agent sau đồ án hoặc sau khi chắc phần lõi

Tái sử dụng code, nhãn và một số test để nghiên cứu vòng phản hồi. Không gom cả hai phạm vi thành cam kết bắt buộc trong 10 tuần. Nếu Agent chỉ là thử nghiệm phụ, tên đề tài và kết luận chính phải phản ánh phần đã đánh giá đầy đủ.

## 10. Khi nào nên đổi sang đề tài 2?

Chỉ cân nhắc khi đồng thời có:

- Tự giải thích được mô hình vault, dòng tài sản và ít nhất vài lỗi bằng phép tính/code, không chỉ nhắc lại câu trả lời LLM.
- Tự viết, chạy và debug được Foundry unit test cùng một PoC nhỏ.
- Ít nhất 3 ca nguồn công khai đã build/run; có verifier mà bạn giải thích và kiểm tra độc lập được.
- Một vòng LLM → test → phản hồi → sửa chạy được trong quota đã đặt.
- Giảng viên đồng ý với phạm vi một nhóm lỗi, số ca nhỏ và bản chất kiểm tra thực nghiệm, không coi đó là chứng minh an toàn toàn bộ.

Mốc hợp lý để kiểm tra là cuối tuần 2; tuy nhiên **không cần bỏ hai tuần thử Agent mới được chọn hướng 1**. Với thông tin hiện tại, có thể chọn hướng 1 ngay và học Foundry ở mức phục vụ đối chiếu. Hướng 2 là lựa chọn có điều kiện, không phải phần còn thiếu của hướng 1.

## 11. Các thắc mắc dễ gặp

### Đề tài 1 có quá đơn giản, chỉ là “API wrapper” không?

Sẽ đơn giản nếu chỉ gửi code rồi xuất câu trả lời. Sẽ có nội dung đồ án khi phải xác định bài toán, tạo bộ ca có nguồn, kiểm soát lộ đáp án, thiết kế baseline, chấm finding và phân tích sai sót. Không thêm framework để thay thế những phần này.

### Có bắt buộc huấn luyện/fine-tune model không?

Chưa có yêu cầu đó từ giảng viên trong thông tin đã cung cấp. Với 10 tuần và dữ liệu chưa thành cặp code–finding tin cậy, chưa nên đưa vào kế hoạch. Nếu rubric bộ môn yêu cầu, cần đổi phạm vi sớm; không ngầm giả định tiêu chí này.

### Có báo cáo Solodit thì RAG chắc tốt hơn không?

Không chắc. Truy xuất có thể sai ngữ cảnh hoặc đưa khuyến nghị không phù hợp; model còn có thể sao chép cách gọi lỗi từ ví dụ. Phải đo A1/A2. Solodit là kho tổng hợp báo cáo; nội dung đúng/sai của ca test vẫn phải kiểm chứng từ nguồn và code.

### Không làm Agent thì có dùng được Slither hoặc Foundry không?

Có. Script có thể gọi công cụ theo thứ tự cố định; người làm cũng có thể dùng test kiểm tra bằng chứng. Điểm phân biệt nằm ở cơ chế chọn hành động và phản hồi, không nằm ở việc có gọi công cụ hay không.

### Slither có tìm được mọi lỗi logic không?

Không có cơ sở để kỳ vọng như vậy. Đối chiếu danh sách detector và từng nhóm lỗi. Nó hữu ích cho thông tin cấu trúc/cảnh báo, nhưng nghiệp vụ có thể cần đặc tả riêng. Lỗi Slither không phát hiện được chưa tự chứng minh LLM đã phát hiện đúng.

### Có PoC chạy thành công thì khỏi cần người chấm?

Vẫn cần thiết kế và kiểm tra oracle/harness. Nếu assertion sai hoặc attacker được cấp tài sản/quyền không hợp lệ, test có thể cho kết quả gây hiểu nhầm. Verifier tin cậy giúp tự động hóa một phần, không tự sinh ra định nghĩa đúng của nghiệp vụ.

### Fuzz hoặc invariant test không tìm ra lỗi thì có thể nói an toàn?

Chỉ có thể nói chưa phát hiện vi phạm trong cấu hình, thuộc tính, trạng thái và ngân sách đã chạy. Kiểm thử hữu hạn không phải chứng minh hình thức. [Foundry](https://getfoundry.sh/forge/invariant-testing?highlight=invariant) là công cụ thực thi kiểm tra, không tự cung cấp đặc tả đúng cho mọi protocol.

### Nếu model không tốt hơn baseline, đồ án có thất bại không?

Không tự động thất bại. Thí nghiệm trung thực có thể chỉ ra giới hạn của phương pháp, điều kiện nào có ích và chi phí tương ứng. Cần trao đổi mục tiêu học thuật với giảng viên, không hứa trước một mức tăng precision/recall chưa đo.

### Có thể chỉ làm “giải thích finding đã biết” cho dễ hơn không?

Có thể là bài toán khác, nhưng phải đăng ký và đánh giá đúng tác vụ đó. Không dùng điểm diễn giải báo cáo làm bằng chứng phát hiện lỗ hổng. Với kế hoạch hiện tại, giữ phát hiện có phạm vi làm bài toán chính sẽ rõ giá trị hơn.

### Có thể chứng minh không rò rỉ dữ liệu từ model được không?

Không với model đóng và dữ liệu công khai chỉ bằng cách tách train/test của đồ án. Có thể kiểm soát prompt, kho truy xuất, project overlap và ghi nhận rủi ro ghi nhớ; không nên tuyên bố hoàn toàn không có contamination.

## 12. Những việc cần chốt sớm với giảng viên

Mang theo bản đề cương có đầu vào/đầu ra, một ví dụ finding và cách chấm để trao đổi ba điểm:

1. Hệ thống ứng dụng LLM kèm dữ liệu và thực nghiệm có đáp ứng yêu cầu bộ môn, hay bắt buộc huấn luyện/phương pháp mới?
2. Phạm vi một nhóm lỗi, hợp đồng nhỏ và bộ ca có đối chứng có được chấp nhận không?
3. Tiêu chí chấm ưu tiên gì: hiểu bài toán, phương pháp, số liệu, sản phẩm hay độ mới? Có yêu cầu tối thiểu về dataset không?

Đây là các thông tin giúp khóa đề cương, không phải lý do trì hoãn đọc code và chuẩn bị dữ liệu đã có thể làm ngay.

Trong vài ngày đầu, nên tạo một ví dụ giải thích hoàn toàn bằng tay, lập manifest 3 ca có nguồn và chạy một baseline nhỏ để biết đầu vào/token. Sau đó bám lịch trong [README](README.md), viết báo cáo song song từ tuần 1 và khóa tính năng cuối tuần 6.

## 13. Phạm vi và nguồn của phân tích này

- Đã đọc ba file đề tài và kiểm kê 3.000 Markdown; chưa mở ZIP, tải các dự án benchmark hoặc chạy LLM/Slither/Foundry để tạo số liệu hiệu năng.
- Đã đối chiếu tài liệu gốc: [Solodit](https://docs.solodit.cyfrin.io/), [Slither](https://github.com/crytic/slither), [Foundry](https://getfoundry.sh/forge/invariant-testing?highlight=invariant), [LLM4Vuln](https://arxiv.org/abs/2401.16185v4), [GPTScan](https://arxiv.org/abs/2308.03314), [PropertyGPT](https://arxiv.org/abs/2405.02580), [SmartBugs Curated](https://github.com/smartbugs/smartbugs-curated), [DeFiVulnLabs](https://github.com/SunWeb3Sec/DeFiVulnLabs) và [DeFiHackLabs](https://github.com/SunWeb3Sec/DeFiHackLabs).
- Đây là tập nguồn có chọn lọc để xác định bài toán và tính khả thi, không phải tổng quan đầy đủ mọi nghiên cứu đến tháng 10/2026. Không lấy chỉ số của bài báo khác làm dự đoán kết quả đồ án.
- Điểm số lựa chọn, quy mô bộ ca, giờ làm và quota là đề xuất. Cần khóa lại sau pilot và yêu cầu chính thức của giảng viên.
