// Đánh giá độ mạnh mật khẩu CHỈ để gợi ý trực quan cho khách - quy tắc bắt
// buộc thật sự (>=8 ký tự, có chữ + có số) nằm ở server/src/utils/password.js
// validateCustomerPasswordStrength(). Thang điểm ở đây rộng hơn (thưởng thêm
// cho hoa/thường/ký tự đặc biệt/độ dài) để khuyến khích mật khẩu tốt hơn mức
// tối thiểu, không phải để chặn submit.
function evaluatePassword(password) {
  if (!password) return { level: 'empty', label: '', percent: 0 };

  const meetsMinimum = password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  if (!meetsMinimum) {
    return { level: 'weak', label: 'Yếu - cần ít nhất 8 ký tự, có cả chữ và số', percent: 25 };
  }

  let score = 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score >= 3) return { level: 'strong', label: 'Mạnh', percent: 100 };
  if (score === 2) return { level: 'medium', label: 'Trung bình', percent: 65 };
  return { level: 'medium', label: 'Đạt yêu cầu - có thể mạnh hơn', percent: 50 };
}

const LEVEL_STYLE = {
  weak: { bar: 'bg-danger', text: 'text-danger' },
  medium: { bar: 'bg-warning', text: 'text-warning-emphasis' },
  strong: { bar: 'bg-success', text: 'text-success' },
};

function PasswordStrengthMeter({ password }) {
  const result = evaluatePassword(password);
  if (result.level === 'empty') return null;

  const style = LEVEL_STYLE[result.level];

  return (
    <div className="mt-1">
      <div className="progress" style={{ height: 4 }}>
        <div className={`progress-bar ${style.bar}`} style={{ width: `${result.percent}%` }}></div>
      </div>
      <div className={`small mt-1 ${style.text}`}>{result.label}</div>
    </div>
  );
}

export default PasswordStrengthMeter;
