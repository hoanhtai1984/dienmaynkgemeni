import { DATE_PRESETS } from '../utils/dateRangePresets';

function DateRangeFilter({ preset, onPresetChange, customFrom, onCustomFromChange, customTo, onCustomToChange, label }) {
  return (
    <div className="row g-2 align-items-end">
      <div className="col-auto">
        <label className="form-label small fw-bold">{label || 'Khoảng thời gian'}</label>
        <select
          className="form-select form-select-sm"
          value={preset}
          onChange={(e) => onPresetChange(e.target.value)}
        >
          {DATE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
      {preset === 'custom' && (
        <>
          <div className="col-auto">
            <label className="form-label small fw-bold">Từ ngày</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
            />
          </div>
          <div className="col-auto">
            <label className="form-label small fw-bold">Đến ngày</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={customTo}
              onChange={(e) => onCustomToChange(e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default DateRangeFilter;
