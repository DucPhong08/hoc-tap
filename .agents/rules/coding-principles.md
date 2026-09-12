# Core Software Design Principles

Khi viết code, refactor hoặc thiết kế kiến trúc trong dự án, Agent phải tuân thủ nghiêm ngặt chuỗi nguyên tắc sau:

1. **KISS (Keep It Simple, Stupid)**:
   - Ưu tiên giải pháp đơn giản, dễ đọc và trực diện nhất giải quyết đúng yêu cầu.
   - Tránh over-engineering; không tạo thêm các lớp trung gian, helper, wrapper không cần thiết.

2. **YAGNI (You Aren't Gonna Need It)**:
   - Chỉ xây dựng những gì cần thiết cho yêu cầu hiện tại.
   - Không viết code mang tính phỏng đoán hay chuẩn bị trước cho các tính năng chưa có yêu cầu ("speculative generality").

3. **DRY (Don't Repeat Yourself)**:
   - Gom logic nghiệp vụ cốt lõi lại một nơi, loại bỏ trùng lặp nghiệp vụ.
   - Lưu ý: Thà chấp nhận trùng lặp nhỏ còn hơn tạo ra một abstraction sai hoặc quá trừu tượng hóa.

4. **SoC (Separation of Concerns) & SRP (Single Responsibility Principle)**:
   - Tách biệt rõ ràng ranh giới giữa các tầng: Presentation/Controller, Application/Domain Service, Infrastructure/Persistence.
   - Mỗi class, hàm hoặc module chỉ đảm nhận một trách nhiệm duy nhất và chỉ có một lý do duy nhất để thay đổi.

5. **SOLID Principles**:
   - **S**RP: Single Responsibility Principle.
   - **O**CP: Open for extension, closed for modification.
   - **L**SP: Liskov Substitution Principle - implementations phải thay thế được abstraction mà không làm vỡ hành vi kỳ vọng.
   - **I**SP: Interface Segregation Principle - thiết kế interface nhỏ, chuyên biệt thay vì fat interfaces.
   - **D**IP: Dependency Inversion Principle - phụ thuộc vào abstraction/interface, không phụ thuộc vào concrete implementation; tận dụng triệt để Dependency Injection.

6. **Low Coupling & High Cohesion**:
   - Giảm thiểu sự gắn kết chặt chẽ (tight coupling) giữa các module; giao tiếp thông qua interfaces/events/DTOs.
   - Giữ các hàm và dữ liệu liên quan chặt chẽ về mặt nghiệp vụ nằm trong cùng một module/service (High Cohesion).

7. **Composition over Inheritance**:
   - Ưu tiên tổng hợp và ủy quyền (composition / delegation) hơn là kế thừa đa tầng.
   - Tránh cấu trúc kế thừa sâu gây giòn gãy và khó bảo trì.

8. **Fail Fast**:
   - Kiểm tra, validate điều kiện tiên quyết (preconditions, DTO validation, config/env) ngay tại ranh giới đầu vào.
   - Báo lỗi hoặc ném ngoại lệ ngay khi phát hiện trạng thái không hợp lệ, không để dữ liệu sai luồn sâu vào hệ thống.

9. **Law of Demeter (Principle of Least Knowledge)**:
   - Một object chỉ nên giao tiếp với các đối tượng cộng tác trực tiếp ("chỉ nói chuyện với bạn bè, không nói chuyện với người lạ").
   - Tránh chuỗi truy cập sâu (ví dụ: `a.getB().getC().doAction()`); hãy đóng gói hành động vào method của đối tượng trực tiếp.
