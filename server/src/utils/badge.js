const BADGE_TO_LABEL = {
  BAN_CHAY_NHAT: 'Bán chạy nhất',
  SAP_CHAY_HANG: 'Sắp cháy hàng',
  VUA_MO_BAN: 'Vừa mở bán',
  MOI: 'Mới',
};

const LABEL_TO_BADGE = Object.fromEntries(
  Object.entries(BADGE_TO_LABEL).map(([enumVal, label]) => [label, enumVal])
);

module.exports = { BADGE_TO_LABEL, LABEL_TO_BADGE };
