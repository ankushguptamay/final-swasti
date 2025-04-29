import { courseCoupons } from "../Config/coupon.js";

async function getOfferedAmount(courseName, couponName, courseAmount) {
  const coupon = courseCoupons.find(
    (c) => c.couponName.toLowerCase() === couponName.toLowerCase()
  );
  if (!coupon) return 0;

  const isApplicable = coupon.appliedTo.some(
    (appliedCourse) => appliedCourse.toLowerCase() === courseName.toLowerCase()
  );
  if (!isApplicable) return 0;

  //   const calculatedDiscount = (coupon.offerPercent / 100) * courseAmount;
  //   return Math.min(calculatedDiscount, coupon.maximumOfferInRupee);
  return coupon.maximumOfferInRupee;
}

export { getOfferedAmount };
