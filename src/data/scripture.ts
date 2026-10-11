// All Scripture quotations are from the King James Version (public domain).

export interface ObedienceStep {
  id: string;
  reference: string;
  text: string;
  action: string;
}

export const OBEDIENCE_STEPS: ObedienceStep[] = [
  { id: 'rom12-13', reference: 'Romans 12:13', text: 'Distributing to the necessity of saints; given to hospitality.', action: 'Invite someone to share a meal with you this week.' },
  { id: 'jas1-19', reference: 'James 1:19', text: 'Let every man be swift to hear, slow to speak, slow to wrath.', action: 'In one conversation today, listen fully before you reply.' },
  { id: 'eph4-32', reference: 'Ephesians 4:32', text: "And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.", action: 'Name one person you need to forgive, and pray for them by name.' },
  { id: 'phil4-6', reference: 'Philippians 4:6', text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.', action: 'Write down three worries and pray over each one with a thank-you.' },
  { id: 'matt5-24', reference: 'Matthew 5:24', text: 'Leave there thy gift before the altar, and go thy way; first be reconciled to thy brother, and then come and offer thy gift.', action: 'Reach out to someone you have tension with.' },
  { id: 'heb10-24', reference: 'Hebrews 10:24', text: 'And let us consider one another to provoke unto love and to good works.', action: 'Send an encouraging message to someone who serves quietly.' },
  { id: '1thes5-18', reference: '1 Thessalonians 5:18', text: 'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.', action: 'Thank God out loud for five ordinary things today.' },
  { id: 'prov3-27', reference: 'Proverbs 3:27', text: 'Withhold not good from them to whom it is due, when it is in the power of thine hand to do it.', action: "Do the good thing you've been putting off." },
  { id: 'matt6-3', reference: 'Matthew 6:3', text: 'But when thou doest alms, let not thy left hand know what thy right hand doeth.', action: 'Give something away anonymously.' },
  { id: 'gal6-2', reference: 'Galatians 6:2', text: 'Bear ye one another’s burdens, and so fulfil the law of Christ.', action: 'Ask someone how they are really doing, and offer one practical help.' },
  { id: 'jas1-27', reference: 'James 1:27', text: 'Pure religion and undefiled before God and the Father is this, To visit the fatherless and widows in their affliction.', action: 'Visit or call someone who is alone.' },
  { id: 'col3-23', reference: 'Colossians 3:23', text: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men.', action: 'Do your least favourite task today with full effort, as worship.' },
  { id: 'ps46-10', reference: 'Psalm 46:10', text: 'Be still, and know that I am God.', action: 'Spend ten minutes in silence, without your phone.' },
  { id: 'prov15-1', reference: 'Proverbs 15:1', text: 'A soft answer turneth away wrath: but grievous words stir up anger.', action: 'When you are frustrated today, answer gently.' },
  { id: 'matt25-35', reference: 'Matthew 25:35', text: 'For I was an hungred, and ye gave me meat: I was thirsty, and ye gave me drink: I was a stranger, and ye took me in.', action: 'Buy a meal for someone in need, or give to a food bank.' },
  { id: 'eph4-29', reference: 'Ephesians 4:29', text: 'Let no corrupt communication proceed out of your mouth, but that which is good to the use of edifying, that it may minister grace unto the hearers.', action: 'Go a full day without complaining or gossip.' },
  { id: '1pet3-15', reference: '1 Peter 3:15', text: 'Be ready always to give an answer to every man that asketh you a reason of the hope that is in you with meekness and fear.', action: 'Write your testimony in three sentences.' },
  { id: 'luke6-28', reference: 'Luke 6:28', text: 'Bless them that curse you, and pray for them which despitefully use you.', action: 'Pray a blessing over someone who has hurt you.' },
  { id: 'mic6-8', reference: 'Micah 6:8', text: 'What doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?', action: 'Choose one act of mercy today that costs you something.' },
  { id: 'rom12-15', reference: 'Romans 12:15', text: 'Rejoice with them that do rejoice, and weep with them that weep.', action: "Celebrate someone's good news, or sit with someone who is grieving." },
  { id: 'matt6-6', reference: 'Matthew 6:6', text: 'But thou, when thou prayest, enter into thy closet, and when thou hast shut thy door, pray to thy Father which is in secret.', action: 'Find a quiet place and pray for fifteen minutes.' },
  { id: 'prov27-2', reference: 'Proverbs 27:2', text: 'Let another man praise thee, and not thine own mouth.', action: 'Publicly give someone else credit for something good.' },
  { id: 'ex20-8', reference: 'Exodus 20:8', text: 'Remember the sabbath day, to keep it holy.', action: 'Plan a real block of rest this week, and protect it.' },
  { id: 'ps119-11', reference: 'Psalm 119:11', text: 'Thy word have I hid in mine heart, that I might not sin against thee.', action: 'Memorise one verse today.' },
  { id: 'luke14-13', reference: 'Luke 14:13', text: 'But when thou makest a feast, call the poor, the maimed, the lame, the blind.', action: 'Include someone who is usually left out.' },
  { id: 'heb13-2', reference: 'Hebrews 13:2', text: 'Be not forgetful to entertain strangers: for thereby some have entertained angels unawares.', action: "Learn the name of a neighbour or colleague you don't know yet." },
  { id: '1john3-18', reference: '1 John 3:18', text: 'My little children, let us not love in word, neither in tongue; but in deed and in truth.', action: 'Turn one "I\'ll pray for you" into a concrete act.' },
  { id: 'phil2-4', reference: 'Philippians 2:4', text: 'Look not every man on his own things, but every man also on the things of others.', action: 'Ask someone about their week, and keep the conversation on them.' },
  { id: 'prov11-25', reference: 'Proverbs 11:25', text: 'The liberal soul shall be made fat: and he that watereth shall be watered also himself.', action: "Give generously to a need you've noticed this week." },
  { id: 'matt5-16', reference: 'Matthew 5:16', text: 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.', action: 'Do one visible kindness at work or school.' },
  { id: 'lam3-22', reference: 'Lamentations 3:22–23', text: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.", action: 'Write down one way God was faithful to you yesterday.' },
];

export const PACT_QUESTIONS = [
  'How is it with your soul this week?',
  'Where did you see God at work?',
  'What temptation did you face, and how did you respond?',
  'Is there anything you are keeping hidden?',
  'Did you keep last week’s commitment?',
  'How can I pray for you?',
];

export const PRAYER_CATEGORIES = ['Family', 'Health', 'Work', 'Friends', 'Church', 'World', 'Guidance', 'Provision', 'Thanksgiving', 'Other'];
