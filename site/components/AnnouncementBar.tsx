import { getActiveStoreCoupon } from "@/lib/coupons";
import CountdownBar from "@/components/CountdownBar";

export default async function AnnouncementBar() {
  const coupon = await getActiveStoreCoupon();
  if (!coupon) return null;

  return (
    <CountdownBar
      code={coupon.code}
      type={coupon.type}
      value={Number(coupon.value)}
      expiresAt={coupon.expiresAt ? coupon.expiresAt.toISOString() : null}
    />
  );
}
