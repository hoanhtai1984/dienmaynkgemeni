import InfoPageLayout from '../../components/InfoPageLayout';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useJsonLd } from '../../hooks/useJsonLd';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';

function CauHoiThuongGap() {
  const { settings } = useSiteSettings();

  useDocumentMeta({
    title: 'Câu Hỏi Thường Gặp - Điện Máy NK',
    description: 'Giải đáp các câu hỏi thường gặp về mua hàng, giao hàng, bảo hành, đổi trả tại Điện Máy NK.',
    path: '/cau-hoi-thuong-gap',
  });

  useJsonLd(
    'faq-jsonld',
    settings.faqItems.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: settings.faqItems.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        }
      : null
  );

  return (
    <InfoPageLayout title="Câu Hỏi Thường Gặp">
      <div className="accordion faq-accordion" id="faqAccordion">
        {settings.faqItems.map((faq, i) => {
          const id = `faq${i + 1}`;
          return (
            <div className="accordion-item" key={id}>
              <h2 className="accordion-header">
                <button
                  className={`accordion-button${i === 0 ? '' : ' collapsed'}`}
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#${id}`}
                >
                  {faq.question}
                </button>
              </h2>
              <div id={id} className={`accordion-collapse collapse${i === 0 ? ' show' : ''}`} data-bs-parent="#faqAccordion">
                <div className="accordion-body text-muted">{faq.answer}</div>
              </div>
            </div>
          );
        })}
      </div>
    </InfoPageLayout>
  );
}

export default CauHoiThuongGap;
