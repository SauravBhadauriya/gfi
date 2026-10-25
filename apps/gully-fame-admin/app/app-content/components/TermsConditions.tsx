'use client';

import { Shield } from 'lucide-react';
import { getTermsAndConditions, updateTermsAndConditions } from '@/lib/cmsApi';
import defaults from '@/lib/appDefaultContent.json';
import TextPageEditor from './TextPageEditor';

export default function TermsConditions() {
  return (
    <TextPageEditor
      title="Terms & Conditions"
      icon={Shield}
      shownIn="Shown in the app under Terms of Service."
      defaultText={defaults.terms}
      contentKey="termsAndConditions"
      load={getTermsAndConditions}
      save={updateTermsAndConditions}
    />
  );
}
