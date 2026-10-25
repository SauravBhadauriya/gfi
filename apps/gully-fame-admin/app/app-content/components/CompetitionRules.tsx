'use client';

import { FileText } from 'lucide-react';
import { getCompetitionRules, updateCompetitionRules } from '@/lib/cmsApi';
import defaults from '@/lib/appDefaultContent.json';
import TextPageEditor from './TextPageEditor';

export default function CompetitionRules() {
  return (
    <TextPageEditor
      title="Competition Rules"
      icon={FileText}
      shownIn="Saved on the backend and served at public/competitionRules. The app does not display it on a screen yet."
      defaultText={''}
      contentKey="competitionRules"
      load={getCompetitionRules}
      save={updateCompetitionRules}
    />
  );
}
