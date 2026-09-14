# Whack-a-Mole — Gameplay mở rộng

Game đập chuột trên trình duyệt, phát triển từ cơ chế Whack-a-Mole với nhiều loại mục tiêu, hệ thống ba mạng và độ khó thay đổi theo điểm số.

Người chơi cần phản xạ nhanh, phân biệt từng loại chuột và tránh các chướng ngại để duy trì lượt chơi.

**[Chơi demo](https://hanari05.github.io/WhackaMole_LTG/)**

## Tổng quan

* **Thể loại:** Arcade, phản xạ.
* **Nền tảng:** Trình duyệt web.
* **Công nghệ:** HTML, CSS, JavaScript.
* **Hình thức:** Dự án nhóm phục vụ học tập và thực hành phát triển game.

## Tính năng

* Bàn chơi gồm **15 ô**, bố trí theo lưới **5 × 3**.
* Hệ thống **ba mạng**, hiển thị bằng trái tim.
* Năm loại chuột với hành vi và hiệu ứng khác nhau.
* Tốc độ xuất hiện mục tiêu thay đổi theo điểm số.
* Số lượng cây tăng dần trong quá trình chơi.
* Hiệu ứng búa, mục tiêu bị đánh, đóng băng và vụ nổ.
* Nhạc nền và hiệu ứng âm thanh riêng biệt.
* Bảng hướng dẫn, menu cài đặt và chức năng chơi lại.
* Hiển thị điểm cao nhất trong phiên sử dụng trang.

## Luật chơi

Nhấp hoặc chạm vào mục tiêu trên bàn chơi. Lượt chơi kết thúc khi số mạng còn lại bằng không.

| Mục tiêu     | Tác động                                         |
| ------------ | ------------------------------------------------ |
| Chuột thường | Cộng 10 điểm khi đánh trúng                      |
| Chuột đội mũ | Cần đánh hai lần; cộng 10 điểm khi hạ            |
| Chuột vàng   | Cộng 20 điểm khi đánh trúng                      |
| Chuột băng   | Đóng băng búa trong 3 giây; không cộng điểm      |
| Chuột bom    | Gây nổ tại ô hiện tại và các ô kề theo bốn hướng |
| Cây          | Mất một mạng khi đánh trúng                      |

### Cơ chế chuột bom

* Nếu vụ nổ chạm vào cây ở ô kề, cây bị loại bỏ và người chơi mất một mạng.
* Nếu không chạm cây, người chơi bị trừ 20 điểm.
* Điểm số có thể xuống dưới 0.

### Độ khó

* Tốc độ xuất hiện tăng tại các mốc **100, 300, 500, 700... điểm**.
* Khoảng thời gian xuất hiện có giới hạn tối thiểu để tránh tăng tốc vô hạn.
* Số cây tăng tại các mốc **200, 400 và 600 điểm**, tối đa bốn cây.

## Âm thanh và giao diện

Trong menu **Settings**, người chơi có thể:

* Điều chỉnh âm lượng nhạc nền — BGM.
* Điều chỉnh âm lượng hiệu ứng — SFX.
* Bật/tắt từng kênh âm thanh.
* Khởi động lại lượt chơi.
* Đóng menu để tiếp tục.

Cài đặt âm thanh được lưu bằng `localStorage`. Best Record hiện được giữ trong bộ nhớ của trang và không được lưu lâu dài sau khi tải lại.

## Chạy trên máy

### Cách 1: Demo trực tuyến

Mở [GitHub Pages](https://hanari05.github.io/WhackaMole_LTG/) bằng trình duyệt.

### Cách 2: Chạy mã nguồn

```bash
git clone https://github.com/Hanari05/WhackaMole_LTG.git
cd WhackaMole_LTG
```

Mở thư mục bằng VS Code và chạy `index.html` qua **Live Server**.

Hoặc sử dụng Python để tạo server tĩnh:

```bash
python -m http.server 8000
```

Sau đó truy cập `http://localhost:8000`.

Dự án không yêu cầu bước build hoặc cài đặt thư viện JavaScript.

## Tổ chức mã nguồn

| Đường dẫn    | Nội dung                                  |
| ------------ | ----------------------------------------- |
| `index.html` | Cấu trúc bàn chơi, hướng dẫn và menu      |
| `mole.css`   | Giao diện, bố cục và hiệu ứng             |
| `mole.js`    | Logic gameplay, điểm số, mạng và âm thanh |
| `assets/`    | Hình ảnh nhân vật, mục tiêu và vật phẩm   |
| `settings/`  | Tài nguyên giao diện cài đặt              |
| `sound/`     | Nhạc nền và hiệu ứng âm thanh             |

## Những phần mở rộng

Dự án tập trung cải tiến trải nghiệm Whack-a-Mole thông qua:

* Mở rộng bàn chơi.
* Thay cơ chế kết thúc ngay bằng hệ thống ba mạng.
* Thêm mục tiêu có độ bền, phần thưởng hoặc hiệu ứng đặc biệt.
* Điều chỉnh độ khó dựa trên tiến trình điểm số.
* Bổ sung hướng dẫn và khả năng tùy chỉnh âm thanh.

## Nhóm thực hiện

* Nông Thị Hồng Lan.
* Nguyễn Ngọc Gia Hân.
* Bảo Diệp.
* Thạch Gia Uy.

**Đóng góp của Nguyễn Ngọc Gia Hân:** Đề xuất cải tiến gameplay, tham gia lập trình hệ thống trái tim và điều chỉnh độ khó. Các tính năng còn lại là kết quả phát triển chung của nhóm.

## Hướng phát triển

* [ ] Lưu điểm cao nhất sau khi tải lại trang.
* [ ] Bổ sung test cho tính điểm, mất mạng và thay đổi độ khó.
* [ ] Kiểm tra tính nhất quán của trạng thái tạm dừng và bộ đếm thời gian.
* [ ] Tối ưu bố cục và thao tác trên nhiều kích thước màn hình.
* [ ] Hoàn thiện ghi nguồn hình ảnh, âm thanh và mã nguồn nền tảng.

## Tài nguyên và ghi nguồn

Hình ảnh và âm thanh bên thứ ba thuộc quyền của các tác giả tương ứng. Việc đưa tài nguyên vào repository không đồng nghĩa với quyền tự do sử dụng hoặc phân phối lại.

Trước khi tái sử dụng hoặc phát hành phiên bản khác, cần kiểm tra điều kiện sử dụng của từng tài nguyên và ghi nguồn phù hợp.
