'use strict';
window.DemoData = (() => {
  const buggy = `// Trích đoạn mô hình vault tối giản — dữ liệu mẫu.
// Token có 0 decimals. Không có phí hoặc chiến lược.
// Trạng thái: 200 assets, 100 shares; Alice giữ 1 share.
pragma solidity ^0.8.20;

contract SampleVault {
    uint256 public totalAssets = 200;
    uint256 public totalSupply = 100;
    mapping(address => uint256) public balanceOf;
    IERC20 public asset;

    function withdraw(uint256 assets) external {
        require(assets > 0 && assets <= totalAssets);
        uint256 shares = assets * totalSupply / totalAssets;
        require(balanceOf[msg.sender] >= shares);
        balanceOf[msg.sender] -= shares;
        totalSupply -= shares;
        totalAssets -= assets;
        require(asset.transfer(msg.sender, assets));
    }
}
// Interface và setup được lược bỏ trong khung đọc code.`;
  const fixed = buggy.replace('uint256 shares = assets * totalSupply / totalAssets;', `uint256 n = assets * totalSupply;
        uint256 shares = n / totalAssets;
        if (n % totalAssets != 0) shares += 1;`);
  const cases = {
    buggy: {name:'Vault · phiên bản có lỗi', file:'SampleVault.sol', code:buggy, location:'SampleVault.sol:14', version:'vulnerable', lines:'14–19'},
    fixed: {name:'Vault · đã sửa lỗi mục tiêu', file:'SampleVault.fixed.sol', code:fixed, location:'SampleVault.fixed.sol:14–16', version:'patched', lines:'14–21'}
  };
  const spec = 'Vault giữ token mô phỏng có 0 decimals, không phí, không chiến lược. Rút tài sản phải đốt đủ cổ phần tương ứng. Trạng thái mẫu: 200 assets / 100 shares; Alice sở hữu 1 share. Đây là trích đoạn để đọc, không phải dự án Solidity đầy đủ có thể build.';
  const sources = [
    {id:'KB-VAULT-01',title:'Hướng làm tròn khi rút tài sản',text:'Trong mô hình này, số cổ phần phải đốt cần làm tròn lên. Làm tròn xuống có thể cho 0 dù lượng tài sản rút lớn hơn 0.'},
    {id:'KB-VAULT-02',title:'Biên số nguyên nhỏ',text:'Kiểm tra riêng trường hợp assets × totalSupply < totalAssets. Giá trị mẫu 1 × 100 < 200 làm lộ nhánh biên.'},
    {id:'KB-VAULT-03',title:'Đối chứng bản sửa',text:'Đối chiếu cùng đầu vào trên phiên bản làm tròn lên. Chỉ kết luận về lỗi mục tiêu, không kết luận contract hết mọi lỗi.'}
  ];
  const pocInitial = `// PoC mẫu rút gọn — chưa thực thi trong trình duyệt.
// Harness: 198 assets / 99 shares; Alice có 2 assets.
function test_withdrawRounding() public {
    vm.startPrank(alice);
    vault.deposit(2); // Thiếu approve trong setup.
    uint256 sharesBefore = vault.balanceOf(alice);
    vault.withdraw(1);
    assertEq(vault.balanceOf(alice), sharesBefore);
    vm.stopPrank();
}`;
  const pocRepaired = `// PoC mẫu rút gọn — chưa thực thi trong trình duyệt.
// Sau deposit: 200 assets / 100 shares; Alice có 1 share.
function test_withdrawRounding() public {
    vm.startPrank(alice);
    asset.approve(address(vault), 2); // Sửa setup.
    vault.deposit(2);
    uint256 sharesBefore = vault.balanceOf(alice);
    uint256 assetsBefore = asset.balanceOf(alice);
    vault.withdraw(1);
    assertEq(vault.balanceOf(alice), sharesBefore);
    assertEq(asset.balanceOf(alice), assetsBefore + 1);
    vm.stopPrank();
}
// Verifier độc lập kiểm tra actor, dòng tài sản,
// cổ phần đã đốt và đối chứng bản sửa trong harness.`;
  const staticOutput = `# Dữ liệu tĩnh mẫu, không phải output Slither thực.
contract: SampleVault
entry point: withdraw(uint256)
reads: totalSupply, totalAssets, balanceOf
writes: balanceOf, totalSupply, totalAssets
external call: asset.transfer(msg.sender, assets)

Lưu ý: thông tin cấu trúc không xác nhận lỗi nghiệp vụ.
Không giả định Slither có detector cho lỗi mục tiêu.`;
  return {cases,spec,sources,pocInitial,pocRepaired,staticOutput};
})();
