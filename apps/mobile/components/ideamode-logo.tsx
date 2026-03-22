import IdeaModeLogoSvg from "@ideamode/assets/ideamode_logo_1.svg";
import type { SvgProps } from "react-native-svg";

type IdeaModeLogoProps = SvgProps & {
  width?: number;
  height?: number;
};

/** Same wordmark as the web app login (`ideamode_logo_1.svg`, light UI). */
export function IdeaModeLogo({
  width = 140,
  height = 21,
  ...rest
}: IdeaModeLogoProps) {
  return (
    <IdeaModeLogoSvg
      width={width}
      height={height}
      accessibilityLabel="IdeaMode"
      accessible
      {...rest}
    />
  );
}
