// Scripture quotations are from the Holy Bible, New International Version® (NIV®), © 1973, 1978, 1984, 2011 by Biblica, Inc.®
// Used with permission. All rights reserved worldwide. See NIV_NOTICE below, which the app displays.

export const BIBLE_VERSION = 'NIV';
export const NIV_NOTICE =
  'Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.® Used with permission. All rights reserved worldwide.';

export interface ObedienceStep {
  id: string;
  reference: string;
  text: string;
  action: string;
}

export const OBEDIENCE_STEPS: ObedienceStep[] = [
  { id: 'rom12-13', reference: 'Romans 12:13', text: `Share with the Lord’s people who are in need. Practice hospitality.`, action: 'Invite someone to share a meal with you this week.' },
  { id: 'jas1-19', reference: 'James 1:19', text: `My dear brothers and sisters, take note of this: Everyone should be quick to listen, slow to speak and slow to become angry…`, action: 'In one conversation today, listen fully before you reply.' },
  { id: 'eph4-32', reference: 'Ephesians 4:32', text: `Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.`, action: 'Name one person you need to forgive, and pray for them by name.' },
  { id: 'phil4-6', reference: 'Philippians 4:6', text: `Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.`, action: 'Write down three worries and pray over each one with a thank-you.' },
  { id: 'matt5-24', reference: 'Matthew 5:24', text: `…leave your gift there in front of the altar. First go and be reconciled to them; then come and offer your gift.`, action: 'Reach out to someone you have tension with.' },
  { id: 'heb10-24', reference: 'Hebrews 10:24', text: `And let us consider how we may spur one another on toward love and good deeds…`, action: 'Send an encouraging message to someone who serves quietly.' },
  { id: '1thes5-18', reference: '1 Thessalonians 5:18', text: `…give thanks in all circumstances; for this is God’s will for you in Christ Jesus.`, action: 'Thank God out loud for five ordinary things today.' },
  { id: 'prov3-27', reference: 'Proverbs 3:27', text: `Do not withhold good from those to whom it is due, when it is in your power to act.`, action: "Do the good thing you've been putting off." },
  { id: 'matt6-3', reference: 'Matthew 6:3', text: `But when you give to the needy, do not let your left hand know what your right hand is doing…`, action: 'Give something away anonymously.' },
  { id: 'gal6-2', reference: 'Galatians 6:2', text: `Carry each other’s burdens, and in this way you will fulfill the law of Christ.`, action: 'Ask someone how they are really doing, and offer one practical help.' },
  { id: 'jas1-27', reference: 'James 1:27', text: `Religion that God our Father accepts as pure and faultless is this: to look after orphans and widows in their distress and to keep oneself from being polluted by the world.`, action: 'Visit or call someone who is alone.' },
  { id: 'col3-23', reference: 'Colossians 3:23', text: `Whatever you do, work at it with all your heart, as working for the Lord, not for human masters…`, action: 'Do your least favourite task today with full effort, as worship.' },
  { id: 'ps46-10', reference: 'Psalm 46:10', text: `Be still, and know that I am God…`, action: 'Spend ten minutes in silence, without your phone.' },
  { id: 'prov15-1', reference: 'Proverbs 15:1', text: `A gentle answer turns away wrath, but a harsh word stirs up anger.`, action: 'When you are frustrated today, answer gently.' },
  { id: 'matt25-35', reference: 'Matthew 25:35', text: `For I was hungry and you gave me something to eat, I was thirsty and you gave me something to drink, I was a stranger and you invited me in…`, action: 'Buy a meal for someone in need, or give to a food bank.' },
  { id: 'eph4-29', reference: 'Ephesians 4:29', text: `Do not let any unwholesome talk come out of your mouths, but only what is helpful for building others up according to their needs, that it may benefit those who listen.`, action: 'Go a full day without complaining or gossip.' },
  { id: '1pet3-15', reference: '1 Peter 3:15', text: `But in your hearts revere Christ as Lord. Always be prepared to give an answer to everyone who asks you to give the reason for the hope that you have. But do this with gentleness and respect…`, action: 'Write your testimony in three sentences.' },
  { id: 'luke6-28', reference: 'Luke 6:28', text: `…bless those who curse you, pray for those who mistreat you.`, action: 'Pray a blessing over someone who has hurt you.' },
  { id: 'mic6-8', reference: 'Micah 6:8', text: `He has shown you, O mortal, what is good. And what does the LORD require of you? To act justly and to love mercy and to walk humbly with your God.`, action: 'Choose one act of mercy today that costs you something.' },
  { id: 'rom12-15', reference: 'Romans 12:15', text: `Rejoice with those who rejoice; mourn with those who mourn.`, action: "Celebrate someone's good news, or sit with someone who is grieving." },
  { id: 'matt6-6', reference: 'Matthew 6:6', text: `But when you pray, go into your room, close the door and pray to your Father, who is unseen. Then your Father, who sees what is done in secret, will reward you.`, action: 'Find a quiet place and pray for fifteen minutes.' },
  { id: 'prov27-2', reference: 'Proverbs 27:2', text: `Let someone else praise you, and not your own mouth; an outsider, and not your own lips.`, action: 'Publicly give someone else credit for something good.' },
  { id: 'ex20-8', reference: 'Exodus 20:8', text: `Remember the Sabbath day by keeping it holy.`, action: 'Plan a real block of rest this week, and protect it.' },
  { id: 'ps119-11', reference: 'Psalm 119:11', text: `I have hidden your word in my heart that I might not sin against you.`, action: 'Memorise one verse today.' },
  { id: 'luke14-13', reference: 'Luke 14:13', text: `But when you give a banquet, invite the poor, the crippled, the lame, the blind…`, action: 'Include someone who is usually left out.' },
  { id: 'heb13-2', reference: 'Hebrews 13:2', text: `Do not forget to show hospitality to strangers, for by so doing some people have shown hospitality to angels without knowing it.`, action: "Learn the name of a neighbour or colleague you don't know yet." },
  { id: '1john3-18', reference: '1 John 3:18', text: `Dear children, let us not love with words or speech but with actions and in truth.`, action: 'Turn one "I\'ll pray for you" into a concrete act.' },
  { id: 'phil2-4', reference: 'Philippians 2:4', text: `…not looking to your own interests but each of you to the interests of the others.`, action: 'Ask someone about their week, and keep the conversation on them.' },
  { id: 'prov11-25', reference: 'Proverbs 11:25', text: `A generous person will prosper; whoever refreshes others will be refreshed.`, action: "Give generously to a need you've noticed this week." },
  { id: 'matt5-16', reference: 'Matthew 5:16', text: `In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven.`, action: 'Do one visible kindness at work or school.' },
  { id: 'lam3-22', reference: 'Lamentations 3:22–23', text: `Because of the LORD’s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.`, action: 'Write down one way God was faithful to you yesterday.' },
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
