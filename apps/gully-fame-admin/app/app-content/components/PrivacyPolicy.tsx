'use client';

import { Shield } from 'lucide-react';
import { getPrivacyPolicy, updatePrivacyPolicy } from '@/lib/cmsApi';
import defaults from '@/lib/appDefaultContent.json';
import TextPageEditor from './TextPageEditor';

export default function PrivacyPolicy() {
  return (
    <TextPageEditor
      title="Privacy Policy"
      icon={Shield}
      shownIn="Shown in the app under Privacy Policy."
      defaultText={defaults.privacy}
      contentKey="privacyPolicy"
      load={getPrivacyPolicy}
      save={updatePrivacyPolicy}
    />
  );
}
