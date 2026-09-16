# App Store & Play Store Submission Guide

## Gully Fame Mobile - Production Deployment

---

## 📱 GOOGLE PLAY STORE SUBMISSION

### Pre-Submission Checklist

#### App Details
- [x] App name: "Gully Fame"
- [x] Package name: "com.gullyfame.mobile"
- [x] App category: Entertainment / Social
- [x] Content rating: Appropriate for intended audience
- [x] Privacy policy: https://gullyfame.com/privacy
- [x] Contact email: support@gullyfame.com

#### Build Requirements
- [x] Minimum SDK: API 21+
- [x] Target SDK: API 34 (or latest)
- [x] App bundle (AAB) for production
- [x] Signed with production keystore
- [x] No debug symbols
- [x] ProGuard/R8 enabled

#### Assets Required
1. **App Icon** (512x512 PNG)
   - Path: `./assets/images/play-store-icon.png`
   - Format: PNG
   - Size: 512x512 pixels
   - No transparency needed

2. **Feature Graphic** (1024x500 PNG)
   - Path: `./assets/images/play-store-feature.png`
   - Displayed on store listing
   - Promotional banner style

3. **Screenshots** (5-8 images)
   - Minimum: 5 screenshots
   - Maximum: 8 screenshots
   - Format: PNG or JPEG
   - Size: 1080x1920 pixels (9:16 ratio)
   - Recommended: Show key features
     - Recording videos
     - Editing interface
     - Video feed
     - Profile
     - Notifications

4. **Video Preview** (Optional)
   - Maximum: 30 seconds
   - Format: MP4 or WebM
   - Resolution: 1920x1080 or higher
   - Should showcase app features

#### Store Listing Content

**Title (50 characters max)**
```
Gully Fame - Create & Share
```

**Short Description (80 characters max)**
```
Create, edit & share short videos with the Gully Fame community
```

**Full Description (4000 characters max)**
```
Welcome to Gully Fame - Your Platform for Creative Expression!

CREATE
- Record videos up to 60 seconds
- Full-featured video editing
- Add text, music, filters & effects
- Perfect quality every time

SHARE
- Post to your feed instantly
- Build your follower community
- Get discovered by millions
- Real-time notifications

ENGAGE
- Like and comment on videos
- Follow creators you love
- Chat with the community
- Trending content daily

FEATURES:
✓ Professional video recording
✓ Advanced editing tools
✓ Music library with trending tracks
✓ Filters and visual effects
✓ Real-time notifications
✓ Community interaction
✓ User profiles & stats
✓ Secure authentication

Join millions of creators sharing their talent on Gully Fame!

Privacy Policy: https://gullyfame.com/privacy
Terms of Service: https://gullyfame.com/terms
Contact: support@gullyfame.com

Permissions:
- Camera: Record videos
- Microphone: Record audio
- Photos: Select media
- Notifications: Stay updated
```

### Submission Steps

1. **Prepare Build**
```bash
cd apps/gully-fame-mobile
npm install
npx expo prebuild --clean
eas build --platform android --profile production
```

2. **Wait for Build Completion**
   - Monitor in EAS dashboard
   - Typically 15-30 minutes
   - Download AAB file when ready

3. **Create Google Play Store Account**
   - Visit: https://play.google.com/console
   - Pay one-time $25 fee
   - Verify email and payment method

4. **Create App on Google Play**
   - Click "Create app"
   - Enter app name
   - Select category
   - Accept policies

5. **Complete Store Listing**
   - Add app title and description
   - Upload screenshots (at least 4)
   - Upload feature graphic
   - Add content rating (select honestly)
   - Set pricing (Free for Gully Fame)

6. **Upload Build**
   - Navigate to "Release" → "Production"
   - Upload AAB file
   - Add release notes
   - Set version name (1.0.0)
   - Set version code (1)

7. **Complete Content Rating**
   - Fill out questionnaire
   - Answer honestly about app content
   - Submit for rating

8. **Review and Submit**
   - Double-check all information
   - Review privacy policy
   - Review terms of service
   - Click "Review"
   - Click "Submit for review"

9. **Await Review**
   - Typically 24-48 hours
   - May request changes
   - Monitor email for updates

10. **Launch**
    - Once approved, click "Release"
    - Select "Production" track
    - Click "Release to Production"
    - App goes live immediately

### Content Rating Guidelines

For Gully Fame, rate based on:
- Violence: None
- Language: Minimal (user-generated content moderated)
- Mature themes: None
- Sexual content: None
- Alcohol/tobacco: None
- Gambling: None

**Suggested Rating: 3+ years**

---

## 🍎 APPLE APP STORE SUBMISSION

### Pre-Submission Checklist

#### App Details
- [x] App name: "Gully Fame"
- [x] Bundle ID: "com.gullyfame.mobile"
- [x] App category: Social Networking / Entertainment
- [x] Privacy policy: https://gullyfame.com/privacy
- [x] Support URL: https://support.gullyfame.com
- [x] Marketing URL: https://gullyfame.com

#### Build Requirements
- [x] iOS 13.5+ minimum
- [x] Xcode 15+ (latest)
- [x] Valid code signing certificate
- [x] Valid provisioning profile
- [x] App Store distribution profile
- [x] No debug code
- [x] Bitcode enabled (if required)

#### Assets Required

1. **App Icon** (1024x1024 PNG)
   - Path: `./assets/images/ios-icon.png`
   - PNG format, no transparency
   - Sharp corners, no border

2. **Screenshots** (2-5 per device)
   - iPad Pro (12.9-inch, 6th generation): 2048x2732
   - iPad Pro (12.9-inch, 5th generation): 2048x2732
   - iPad Pro (11-inch, 3rd generation): 1668x2388
   - iPhone 6.7-inch: 1284x2778
   - iPhone 6.5-inch: 1242x2688
   - iPhone 5.8-inch: 1125x2436
   - iPhone 5.5-inch: 1080x1920

3. **App Preview Video** (Optional)
   - Duration: 15-30 seconds
   - Format: MP4
   - Resolution: 1920x1080 or higher
   - Should showcase key features

4. **App Icon** (For App Store)
   - Size: 1024x1024 PNG
   - Must be opaque
   - No transparency
   - Safe area must not be cluttered

#### Store Listing Content

**App Name (30 characters max)**
```
Gully Fame
```

**Subtitle (30 characters max)**
```
Create & Share Videos
```

**Keyword Tags (100 characters max)**
```
video, sharing, social, creative, editing, music, entertainment
```

**Description (4000 characters max)**
```
[Same as Google Play Store description above]
```

**Support URL**
```
https://support.gullyfame.com
```

**Privacy Policy URL**
```
https://gullyfame.com/privacy
```

### Submission Steps

1. **Prepare Build**
```bash
cd apps/gully-fame-mobile
npm install
npx expo prebuild --clean
eas build --platform ios --profile production
```

2. **Wait for Build Completion**
   - Monitor in EAS dashboard
   - Typically 30-45 minutes
   - Download IPA when ready

3. **Enroll in Apple Developer Program**
   - Visit: https://developer.apple.com/programs/
   - Pay annual $99 fee
   - Complete enrollment process
   - Verify email

4. **Create App ID**
   - Visit App Store Connect: https://appstoreconnect.apple.com
   - Create new app ID
   - Enter bundle ID: com.gullyfame.mobile
   - Enable required capabilities

5. **Create App Store Record**
   - Click "My Apps"
   - Click "+"
   - Select "New App"
   - Fill in basic information:
     - Primary language: English
     - App name: "Gully Fame"
     - Bundle ID: com.gullyfame.mobile
     - SKU: gully-fame-001 (any unique value)

6. **Complete App Information**
   - Category: Social Networking or Entertainment
   - Rating: 4+ (select appropriate)
   - Content rights: Certify compliance
   - Age rating: Declare if needed

7. **Upload Screenshots**
   - For each device size, upload 2-5 screenshots
   - PNG or JPEG format
   - High quality, clearly show features
   - Include promotional text if desired

8. **Add Descriptive Information**
   - Title: "Gully Fame"
   - Subtitle: "Create & Share Videos"
   - Description: [Full description above]
   - Keywords: [Keywords above]
   - Support URL: https://support.gullyfame.com
   - Privacy Policy URL: https://gullyfame.com/privacy
   - Marketing URL: https://gullyfame.com (optional)

9. **Build & Version**
   - In Xcode: Product → Archive
   - Or use EAS build
   - Upload build via Transporter or Xcode
   - Set version: 1.0.0
   - Build number: 1

10. **Review Notes**
    - Add release notes (required for each submission):
    ```
    Welcome to Gully Fame!
    - Create and edit videos up to 60 seconds
    - Add music, text, filters, and effects
    - Share with the Gully Fame community
    - Discover trending content
    ```

11. **Review Submission**
    - Check "Build" section
    - Ensure build is present
    - Review all information
    - Click "Submit for Review"

12. **Await Review**
    - Typically 24-48 hours
    - Apple may request changes
    - Common rejection reasons:
      - Crashes on launch
      - Misleading description
      - Inappropriate content
      - Missing privacy policy

13. **Approval and Release**
    - Once approved, app is in "Ready for Sale"
    - Click "Release" to go live
    - App becomes available immediately

---

## 📋 COMMON ISSUES & SOLUTIONS

### Play Store Issues

**Issue: App crashes on launch**
- Solution: Check logcat for errors
- Ensure all native modules properly linked
- Verify all permissions are handled

**Issue: Build rejected for policy violation**
- Solution: Review Play Store policies
- Ensure no misleading descriptions
- Verify all permissions justified

**Issue: Upload rejected for security**
- Solution: Ensure HTTPS used everywhere
- Remove debug keys/certificates
- Check for hardcoded credentials

### App Store Issues

**Issue: App rejected for crashes**
- Solution: Test thoroughly on physical devices
- Check crash reports in App Store Connect
- Fix identified issues and resubmit

**Issue: App rejected for incomplete information**
- Solution: Fill all required fields
- Provide accurate descriptions
- Include all required screenshots

**Issue: Code signing errors**
- Solution: Verify certificates in developer account
- Regenerate provisioning profiles
- Check bundle ID matches app ID

---

## 🚀 RELEASE PROCESS

### Version Management
```
Format: MAJOR.MINOR.PATCH
Example: 1.0.0 (first release)
Example: 1.0.1 (bug fix)
Example: 1.1.0 (new features)
```

### Release Checklist
- [ ] Bump version in app.json
- [ ] Bump version in eas.json
- [ ] Update release notes
- [ ] Test all features
- [ ] Run production build locally
- [ ] Review security settings
- [ ] Verify analytics integration
- [ ] Test error handling
- [ ] Check performance
- [ ] Review crash logs

### Update Process
1. Merge changes to main branch
2. Update version numbers
3. Create production build
4. Test build on physical device
5. Upload to store
6. Wait for review
7. Release when approved
8. Monitor crash reports

---

## 📊 POST-LAUNCH MONITORING

### Essential Metrics
- App installation rate
- Daily active users (DAU)
- Monthly active users (MAU)
- Crash rate (should be < 0.1%)
- Average session duration
- User retention (1-day, 7-day, 30-day)
- App rating and reviews

### Crash Monitoring
- **Google Play**: Google Play Console crash reports
- **Apple**: App Store Connect TestFlight & crash reports
- **Sentry** (optional): Advanced crash analytics

### Rating & Review Management
- Monitor ratings weekly
- Respond to user reviews
- Address common issues quickly
- Thank users for positive feedback
- Apologize for negative experiences
- Implement improvements

---

## 📝 STORE POLICY COMPLIANCE

### Google Play Store Policies
- ✅ No malware or spyware
- ✅ No misleading content or ads
- ✅ Age-appropriate content
- ✅ Privacy policy required
- ✅ Proper content rating
- ✅ No deceptive practices
- ✅ All permissions justified
- ✅ No non-functional features

### Apple App Store Policies
- ✅ App works as described
- ✅ No crashes on launch
- ✅ Proper privacy handling
- ✅ No deceptive UI
- ✅ Accurate metadata
- ✅ Age-appropriate rating
- ✅ No misleading features
- ✅ Must have legitimate purpose

---

## 🔐 CREDENTIALS & ACCOUNTS

### Required Accounts
1. **Google Developer Account**
   - Email: support@gullyfame.com
   - Password: [Store securely]
   - 2FA enabled
   - Team members invited

2. **Apple Developer Account**
   - Email: support@gullyfame.com
   - Password: [Store securely]
   - 2FA enabled
   - Team members invited

3. **EAS Account** (Expo)
   - Account: gullyfameindia
   - Project ID: f5294312-557c-428a-a89b-12a7193444b5
   - Build credentials stored

### Backup & Recovery
- Store account details securely (password manager)
- Enable 2FA on all accounts
- Keep backup email addresses updated
- Document recovery codes
- Test recovery process monthly

---

## ✅ FINAL SIGN-OFF

**Pre-Launch Verification**
- [ ] All tests passing
- [ ] Production build tested
- [ ] Security reviewed
- [ ] Permissions configured
- [ ] Privacy policy available
- [ ] Terms of service available
- [ ] Support system ready
- [ ] Monitoring configured

**Store Information**
- [ ] App name confirmed
- [ ] Description finalized
- [ ] Screenshots uploaded
- [ ] Icon set correctly
- [ ] Category selected
- [ ] Rating selected
- [ ] Content policy acknowledged
- [ ] Developer details verified

**Go-Live Readiness**
- [ ] Team notified
- [ ] Launch date set
- [ ] Marketing plan ready
- [ ] Support team briefed
- [ ] Analytics dashboard ready
- [ ] Crash monitoring active
- [ ] Rating monitoring active
- [ ] Update process documented

---

## 📞 SUPPORT & ESCALATION

**Support Channels**
- Email: support@gullyfame.com
- Website: https://gullyfame.com
- Twitter: @gullyfame
- Instagram: @gullyfame

**Escalation Process**
1. Attempt to resolve within 24 hours
2. Escalate to development team
3. Prepare fix/workaround
4. Communicate with user
5. Implement solution
6. Follow up with user

---

## 📚 RESOURCES

- **Google Play Console**: https://play.google.com/console
- **Apple App Store Connect**: https://appstoreconnect.apple.com
- **EAS Build Documentation**: https://docs.expo.dev/build/
- **Expo Deployment Guide**: https://docs.expo.dev/distribution/
- **React Native Security**: https://reactnative.dev/docs/security
- **Google Play Policies**: https://play.google.com/about/developer-content-policy/
- **Apple App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Ready for Submission
