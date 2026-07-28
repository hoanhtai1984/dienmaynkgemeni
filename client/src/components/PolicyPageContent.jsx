import { useSiteSettings } from '../hooks/useSiteSettings';

// Thay các token động ({hotline}/{email}/{address}) bằng giá trị thật từ cài
// đặt - để admin không phải gõ tay số điện thoại/email vào từng mục nội dung
// (tự động theo kịp khi admin đổi hotline ở "Cài đặt chung").
function applyTokens(text, settings) {
  return text
    .replaceAll('{hotline}', settings.hotline || '')
    .replaceAll('{email}', settings.email || '')
    .replaceAll('{address}', settings.address || '')
    .replaceAll('{workingHours}', settings.workingHours || '');
}

// Hỗ trợ **in đậm** dạng markdown rút gọn - đủ dùng cho nội dung chính sách
// (nhấn mạnh hotline, từ khoá quan trọng) mà không cần trình soạn thảo rich-text.
function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    )
  );
}

// Mỗi đoạn cách nhau bởi dòng trống - đoạn nào TOÀN BỘ các dòng đều bắt đầu
// bằng "- " thì render thành danh sách gạch đầu dòng, còn lại render thành 1
// đoạn văn (nối các dòng bằng khoảng trắng).
function renderBody(body) {
  const blocks = body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block, blockIndex) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const isList = lines.length > 0 && lines.every((l) => l.startsWith('- '));
    if (isList) {
      return (
        <ul key={blockIndex}>
          {lines.map((l, i) => (
            <li key={i}>{renderInline(l.slice(2), `${blockIndex}-${i}`)}</li>
          ))}
        </ul>
      );
    }
    return <p key={blockIndex}>{renderInline(lines.join(' '), `${blockIndex}`)}</p>;
  });
}

function PolicyPageContent({ slug, defaultSections }) {
  const { settings } = useSiteSettings();
  const savedSections = settings.policyPages?.[slug]?.sections;
  const sections = savedSections?.length ? savedSections : defaultSections;

  return (
    <>
      {sections.map((section, i) => (
        <div key={i}>
          {section.heading && <h2>{applyTokens(section.heading, settings)}</h2>}
          {renderBody(applyTokens(section.body, settings))}
        </div>
      ))}
    </>
  );
}

export default PolicyPageContent;
