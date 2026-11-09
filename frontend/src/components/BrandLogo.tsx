import universityLogo from "../../asset/LOGO_UIS_PNG_(2).png";
import { Picture } from "./Picture";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Picture
      src={universityLogo}
      alt=""
      width={475}
      height={408}
      sizes="3.5rem"
      priority
      fit="contain"
      className={className}
      fallbackLabel="UIS"
    />
  );
}
