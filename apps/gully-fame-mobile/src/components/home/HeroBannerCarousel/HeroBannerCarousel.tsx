import { homePageHeroSlidesAPIData } from "@/types/homePageHeroSlides";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  Image,
  View,
  Text,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from "react-native";
import { styles } from "./styles";
import { wp } from "@/utils/responsive";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TALENT_CATEGORIES } from "@/constants/talentCategories";
import { resolveMediaUrl } from "@/utils/mediaUrl";

const HERO_IMAGE = require("@assets/images/carousel1.png");
const LOCAL_SLIDES = TALENT_CATEGORIES.map((c, i) => ({ id: i + 1, ...c }));
const getDimensions = () => Dimensions.get("window");
type Slide =
  | { kind: "banner"; id: string | number; title: string; image: string }
  | ({ kind: "local" } & (typeof LOCAL_SLIDES)[number]);

const HeroBannerCarousel = ({ slides: remoteSlides }: {
  slides?: homePageHeroSlidesAPIData[];
}) => {
  // Banners added in the admin panel (App Content > Home Banners) replace the built-in category
  // slides. The built-in slides only show while there are no active banners.
  const bannerSlides: Slide[] = (remoteSlides ?? [])
    .map((b, i): Slide | null => {
      const image = resolveMediaUrl(b.image);
      return image ? { kind: "banner", id: b.id ?? i, title: b.title ?? "", image } : null;
    })
    .filter((s): s is Slide => s !== null);
  const slides: Slide[] = bannerSlides.length > 0 ? bannerSlides : LOCAL_SLIDES.map((s) => ({ kind: "local" as const, ...s }));
  const renderSlideContent = (slide: Slide) =>
    slide.kind === "banner" ? (
      <View style={styles.heroBannerWrapper}>
        <Image source={{ uri: slide.image }} style={styles.heroBannerImage} />
        {slide.title ? (
          <View style={styles.heroBannerCaption}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {slide.title}
            </Text>
          </View>
        ) : null}
      </View>
    ) : (
      <View style={styles.heroContent}>
        <MaterialCommunityIcons name={slide.icon} size={wp(14)} color="#fff" style={styles.heroIcon} />
        <Text style={styles.heroTitle}>{slide.name}</Text>
        <Text style={styles.heroTagline}>{slide.tagline}</Text>
        <Text style={styles.heroSubtitle}>{slide.description}</Text>
      </View>
    );
  const carouselRef = useRef<ScrollView | null>(null);
  const [dimensions, setDimensions] = useState(getDimensions());
  const indexRef = useRef(0);
  const widthRef = useRef(dimensions.width);
  widthRef.current = dimensions.width;
  const jumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The last slide is followed by a copy of the first; once it is reached, jump back silently.
  const resetIfAtEnd = (x: number) => {
    const slideIndex = Math.round(x / widthRef.current);
    if (slideIndex >= slides.length) {
      carouselRef.current?.scrollTo({ x: 0, animated: false });
      indexRef.current = 0;
    } else {
      indexRef.current = slideIndex;
    }
  };
  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    resetIfAtEnd(e.nativeEvent.contentOffset.x);
  };
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      const next = indexRef.current + 1;
      indexRef.current = next;
      carouselRef.current?.scrollTo({ x: next * widthRef.current, animated: true });
      if (next >= slides.length) {
        // Fallback in case no momentum-end event fires after a programmatic scroll.
        jumpTimer.current = setTimeout(() => {
          carouselRef.current?.scrollTo({ x: 0, animated: false });
          indexRef.current = 0;
        }, 700);
      }
    }, 4000);
    return () => {
      clearInterval(interval);
      if (jumpTimer.current) clearTimeout(jumpTimer.current);
    };
  }, [slides.length]);
  return (
    <>
      {/* One fixed background; only the text and icon change between slides. */}
      {bannerSlides.length === 0 && <Image source={HERO_IMAGE} style={styles.heroBackgroundImage} />}
      <ScrollView
        ref={carouselRef}
        horizontal
        pagingEnabled
        onMomentumScrollEnd={onMomentumScrollEnd}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {slides.map((slide) => (
          <View key={`${slide.kind}-${slide.id}`} style={[styles.heroSlideWrapper, { width: dimensions.width }]}>
            {renderSlideContent(slide)}
          </View>
        ))}
        {slides.length > 0 && (
          <View style={[styles.heroSlideWrapper, { width: dimensions.width }]}>{renderSlideContent(slides[0])}</View>
        )}
      </ScrollView>
    </>
  );
};
export default HeroBannerCarousel;
