import React from "react";
import { Svg, Rect, Defs, Pattern, Image } from "react-native-svg";

export const SuccessIcon = ({ width = 75, height = 100 }) => (
  <Svg width={width} height={height} viewBox="0 0 75 100" fill="none">
    <Defs>
      <Pattern
        id="pattern0_298_1365"
        patternContentUnits="objectBoundingBox"
        width="1"
        height="1"
      >
        <Image
          width="100"
          height="100"
          preserveAspectRatio="none"
          href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGKUlEQVR4nO2dy28cRRCHOzzFOyCQeCMugFBIAMdbtSZgIi5ISNwIz3+BG5ccIgtx5oCUGNZbvYsJp9x8iTiRWwIREgjEBccxgaCQELzTPbt5ETSoZteOA8bex/R0zW5/Uh3sw053/aZ6erqrepQKBAKBQCAQCAQCgUAgEOibqIp3RVV8yxCQJThqCM4YDRdSIzjT+V810uU3G/XJzb7bO7TEVdhqCfcbjZesxqQbM4QXLcFsXMOnfLd/qCLCEFaMxr+7FeK/wsBlo+HjaHrHnb77U2ia9Ymnrcbj/QqxRsT8EtXK4777VUhiKr9kNbayEmOVteIqvOi7f4XC1MoTjsRoG2HTzJTQdz9FcnZ/6fbkAN60/LfVO+4xBCedibE8fGn8la+1fF1uA7dFjRJ/0MRtEeHblrBmNPzAd+oVB8FfluCYJVxwLcaqSFnga6bXXvk/xIbge6tBc1u5zWrYWKLyI/xusFqA4hjEPMtbqjz3sCo6SWXseqPxA35p8+9YHGyIIzhvCN7nPqki0popPWg1fuPbkTZrIzjaoon7VZGw9fITPOf37jztyuCEoYnHVRHgu8dq+Nm/09Cp8UzwXG37Q0oyPL4O5TCl/zdSvk6mJq9TUuEHuH8nYb5GOKXETm2HYDZl+5h9iRy60vcMAQ6yXkTBaSWJ03snb+UXKN+Osd4MYvaBkoLR8I5/p6BXiwneUFLgdR/fDrGejZdXlBSShUIBTrF+BflOScFqsL4dYv1bpCTwW2XsZgHOSCRY8tHLN/rWI93Y8e0Im6EZjV9GhO+yGY2HehLkwJM3+NZDJQdeu/bqDZ4CWxV3J4natNK3RG2yGj/sUshLyZS6Rkkg3ekremRQ6b21+sbDkNH4+4a/QfiTkgDvS+e67arzE2OljwRfdCHIwuo9em/ZIXkkJFiPYqT9JPyxu9+Ck4YmysoHlsovFH65pIq7N+qnodIrPf5ui3PKVJ40avitITg37JHRoPIzVsOfffx+i7Muc8u1tYSLvh1q5YqxbMdzySXmNRvfDrWOh6k0p5jwrPhleS4JGCQLfUQiI7lyPbjstBTCavjct1NtASLjKiOYdVmncdG7Y7X8yLj62njRSSVXYTehqp4iw/XmVVrT59u5ujiR4XzzilMoM28sYS2m8hZbGbvbELxqNcwPmxgdO5K5IIbgtOu7plGf3JyF8MLE4L6eyl6QjHOuOI9rTUfVBxNFmhjtNsE50YLw/Hy9FMxGn6JIFMOdIBkPWVEVS+s6rt6bKFLFcDZkcWJxxg09stGWZ6NLUSSL0TY4rAoy7Z0bVBQjXoy0fvITlTV8voiTBhMe3ChbY6kydocl/EriS183FmvcpbKGl5IdLp30HCmmAJHRiY4LfEMpF/BCmbPG9xIp1WJERqdfNeV0+Z3gssMOzG0UKd3kPkmIjJXldypvUS7hB5TjO+rgIBmAYiKjLche5Rp+lmR5Qk+/kSI5Mto3FhzL7QC1dscdHg6jexdFlhjYbOrSNpUntlZ63nkaEHU3fEkapliMmEo7lQ84KSyHRLm59SJFUmTwCUNGA6gRSCWdW0sUSWKISCXNM9naaDzUmCk9upyVztuiVsOSdyFWDOaVBHIvR6A0GiP/AggtRxi2gh07gIk4uikIgrIqqJhQ9Ilyij6ZUBaNvEzyrZJCODgA3WxC9Ut60qgAp1iPJupojc7hMyP8HAFZh88MRd2I7t+Mxn1KGq1P8YGil7nZfsQgOM8nsCqJ8Lm2vh1kczfYo0QfgukiKVtLNTgs+hDMUTom1hIuNuvj96oiwIcMD7UohItmZvwxVSQ6kZJ1+mni3+BwszJ2nyoiPL7yubbDMPsyaR9gj/hnRjfwtJBrtgv58kho+D2Dp/Vq2Dj12dZb+PuCRuMMn1G4eqOp/Tk8mM/9gy4a5v/1Kb6IFwr5RZeXQ7jNapSxnj55FNggm8U6/RoPxN6zQ4pGTKWdTpLx2kJP+u5fIWnq0rZsnylwIqLx7b77VWiidl3K9CBZ9+1Pr+K+8LHizD9ODLO9FA11Kofr4ePEDmnUJzfHNXi9s/9yhCtc+aWtbXiK36TTKavGXc4qlwKBQCAQCAQCgUAgEAio0eAfi7Xd4ocnQnIAAAAASUVORK5CYII="
          transform="matrix(0.01 0 0 0.0075 0 0.125)"
        />
      </Pattern>
    </Defs>
    <Rect width="75" height="100" fill="url(#pattern0_298_1365)" />
  </Svg>
);

// Social Login Icons
