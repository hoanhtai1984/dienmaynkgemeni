import { Link } from 'react-router-dom';
import InfoSidebar from './InfoSidebar';

function InfoPageLayout({ title, breadcrumb, children }) {
  return (
    <main>
      <section className="info-banner">
        <div className="container">
          <nav aria-label="breadcrumb" className="breadcrumb">
            <ol className="breadcrumb m-0">
              <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
              <li className="breadcrumb-item active" aria-current="page">{breadcrumb || title}</li>
            </ol>
          </nav>
          <h1 className="m-0">{title}</h1>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-3">
              <InfoSidebar />
            </div>
            <div className="col-lg-9">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default InfoPageLayout;
