'use client';

import { Info } from 'lucide-react';
import { getAboutUs, updateAboutUs } from '@/lib/cmsApi';
import defaults from '@/lib/appDefaultContent.json';
import TextPageEditor from './TextPageEditor';

export default function AboutUs() {
  return (
    <TextPageEditor
      title="About Us"
      icon={Info}
      shownIn="Shown in the app under Settings > About."
      defaultText={defaults.about}
      contentKey="aboutUs"
      load={getAboutUs}
      save={updateAboutUs}
    />
  );
}
