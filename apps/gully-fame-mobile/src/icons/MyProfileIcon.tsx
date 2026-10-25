import React from "react";
import { Svg, Path, Defs, LinearGradient, Stop } from "react-native-svg";

export const MyProfileIcon = ({ width = 22, height = 22, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 22 22" fill="none" {...props}>
    <Path
      d="M0 2C0 0.89543 0.895431 0 2 0H20C21.1046 0 22 0.895431 22 2V20C22 21.1046 21.1046 22 20 22H2C0.89543 22 0 21.1046 0 20V2Z"
      fill="url(#paint0_linear_111_282)"
    />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18.9069 11.7094C19.0674 11.9341 19.0153 12.2464 18.7906 12.4069C16.9253 13.7393 14.9236 14.0493 13.199 13.8724C11.4874 13.6968 10.0222 13.0396 9.19303 12.3947C8.97506 12.2251 8.93579 11.911 9.10532 11.693C9.27486 11.4751 9.589 11.4358 9.80697 11.6053C10.4778 12.1271 11.7626 12.7198 13.301 12.8776C14.8264 13.0341 16.5747 12.7607 18.2094 11.5931C18.4341 11.4326 18.7464 11.4847 18.9069 11.7094Z"
      fill="white"
    />
    <Path
      d="M18.75 7.25C18.75 7.94036 18.1904 8.5 17.5 8.5C16.8096 8.5 16.25 7.94036 16.25 7.25C16.25 6.55964 16.8096 6 17.5 6C18.1904 6 18.75 6.55964 18.75 7.25Z"
      fill="white"
    />
    <Path
      d="M5.75 7.25C5.75 7.94036 5.19036 8.5 4.5 8.5C3.80964 8.5 3.25 7.94036 3.25 7.25C3.25 6.55964 3.80964 6 4.5 6C5.19036 6 5.75 6.55964 5.75 7.25Z"
      fill="white"
    />
    <Defs>
      <LinearGradient
        id="paint0_linear_111_282"
        x1="11"
        y1="0"
        x2="11"
        y2="22"
        gradientUnits="userSpaceOnUse"
      >
        <Stop />
        <Stop offset="0.501305" stopColor="#828282" />
        <Stop offset="1" stopColor="#F7F7F7" />
      </LinearGradient>
    </Defs>
  </Svg>
);
