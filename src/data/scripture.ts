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

export type Era = 'patriarchs' | 'kingdom' | 'jesus' | 'church';

export interface BiblicalSite {
  id: string;
  name: string;
  lat: number;
  lng: number;
  era: Era;
  reference: string;
  text: string;
  story: string;
}

export const ERAS: Record<Era, { label: string; color: string }> = {
  patriarchs: { label: 'Patriarchs & Exodus', color: '#8b5e3c' },
  kingdom: { label: 'Kings, Prophets & Exile', color: '#b8893b' },
  jesus: { label: 'Life of Jesus', color: '#3f5a36' },
  church: { label: 'The Early Church', color: '#5f7f9a' },
};

export const BIBLICAL_SITES: BiblicalSite[] = [
  { id: 'ur', name: 'Ur of the Chaldees', lat: 30.9626, lng: 46.1031, era: 'patriarchs', reference: 'Genesis 12:1', text: 'Now the LORD had said unto Abram, Get thee out of thy country, and from thy kindred, and from thy father’s house, unto a land that I will shew thee.', story: 'Abram’s journey of faith begins.' },
  { id: 'ararat', name: 'Mount Ararat', lat: 39.7019, lng: 44.2983, era: 'patriarchs', reference: 'Genesis 9:13', text: 'I do set my bow in the cloud, and it shall be for a token of a covenant between me and the earth.', story: 'The ark comes to rest; God’s covenant with Noah.' },
  { id: 'giza', name: 'Egypt', lat: 29.9792, lng: 31.1342, era: 'patriarchs', reference: 'Genesis 50:20', text: 'But as for you, ye thought evil against me; but God meant it unto good.', story: 'Joseph forgives his brothers.' },
  { id: 'redsea', name: 'The Red Sea', lat: 29.75, lng: 32.6, era: 'patriarchs', reference: 'Exodus 14:14', text: 'The LORD shall fight for you, and ye shall hold your peace.', story: 'Israel passes through the sea on dry ground.' },
  { id: 'sinai', name: 'Mount Sinai', lat: 28.5394, lng: 33.975, era: 'patriarchs', reference: 'Exodus 20:2', text: 'I am the LORD thy God, which have brought thee out of the land of Egypt, out of the house of bondage.', story: 'The Law is given to Moses.' },
  { id: 'nebo', name: 'Mount Nebo', lat: 31.768, lng: 35.7256, era: 'patriarchs', reference: 'Deuteronomy 31:8', text: 'And the LORD, he it is that doth go before thee; he will be with thee, he will not fail thee, neither forsake thee: fear not, neither be dismayed.', story: 'Moses sees the promised land.' },
  { id: 'jericho', name: 'Jericho', lat: 31.871, lng: 35.444, era: 'kingdom', reference: 'Joshua 6:20', text: 'When the people heard the sound of the trumpet, and the people shouted with a great shout, that the wall fell down flat.', story: 'The walls fall at God’s word.' },
  { id: 'carmel', name: 'Mount Carmel', lat: 32.672, lng: 35.087, era: 'kingdom', reference: '1 Kings 18:39', text: 'And when all the people saw it, they fell on their faces: and they said, The LORD, he is the God; the LORD, he is the God.', story: 'Elijah and the fire from heaven.' },
  { id: 'jerusalem', name: 'Jerusalem', lat: 31.778, lng: 35.2354, era: 'kingdom', reference: 'Psalm 122:6', text: 'Pray for the peace of Jerusalem: they shall prosper that love thee.', story: 'The city of David and the temple.' },
  { id: 'nineveh', name: 'Nineveh', lat: 36.3594, lng: 43.1529, era: 'kingdom', reference: 'Jonah 4:11', text: 'And should not I spare Nineveh, that great city?', story: 'God’s mercy to a city that repents.' },
  { id: 'babylon', name: 'Babylon', lat: 32.5422, lng: 44.4209, era: 'kingdom', reference: 'Daniel 6:22', text: 'My God hath sent his angel, and hath shut the lions’ mouths, that they have not hurt me.', story: 'Daniel remains faithful in exile.' },
  { id: 'bethlehem', name: 'Bethlehem', lat: 31.7054, lng: 35.2024, era: 'jesus', reference: 'Luke 2:11', text: 'For unto you is born this day in the city of David a Saviour, which is Christ the Lord.', story: 'The birth of Jesus.' },
  { id: 'nazareth', name: 'Nazareth', lat: 32.6996, lng: 35.3035, era: 'jesus', reference: 'Luke 2:52', text: 'And Jesus increased in wisdom and stature, and in favour with God and man.', story: 'Jesus grows up.' },
  { id: 'jordan', name: 'The Jordan River', lat: 31.837, lng: 35.5503, era: 'jesus', reference: 'Matthew 3:17', text: 'And lo a voice from heaven, saying, This is my beloved Son, in whom I am well pleased.', story: 'The baptism of Jesus.' },
  { id: 'cana', name: 'Cana', lat: 32.7466, lng: 35.3397, era: 'jesus', reference: 'John 2:11', text: 'This beginning of miracles did Jesus in Cana of Galilee, and manifested forth his glory; and his disciples believed on him.', story: 'Water becomes wine.' },
  { id: 'beatitudes', name: 'Mount of Beatitudes', lat: 32.881, lng: 35.556, era: 'jesus', reference: 'Matthew 5:9', text: 'Blessed are the peacemakers: for they shall be called the children of God.', story: 'The Sermon on the Mount.' },
  { id: 'galilee', name: 'Sea of Galilee', lat: 32.8303, lng: 35.5833, era: 'jesus', reference: 'Mark 4:39', text: 'And he arose, and rebuked the wind, and said unto the sea, Peace, be still. And the wind ceased, and there was a great calm.', story: 'Jesus calms the storm.' },
  { id: 'bethany', name: 'Bethany', lat: 31.771, lng: 35.261, era: 'jesus', reference: 'John 11:25', text: 'Jesus said unto her, I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live.', story: 'Lazarus is raised.' },
  { id: 'gethsemane', name: 'Gethsemane', lat: 31.7794, lng: 35.2398, era: 'jesus', reference: 'Luke 22:42', text: 'Nevertheless not my will, but thine, be done.', story: 'Jesus prays in the garden.' },
  { id: 'tomb', name: 'The Empty Tomb', lat: 31.7839, lng: 35.2299, era: 'jesus', reference: 'Matthew 28:6', text: 'He is not here: for he is risen, as he said.', story: 'The resurrection.' },
  { id: 'damascus', name: 'Damascus', lat: 33.513, lng: 36.292, era: 'church', reference: 'Acts 9:18', text: 'And immediately there fell from his eyes as it had been scales: and he received sight forthwith, and arose, and was baptized.', story: 'Saul becomes Paul.' },
  { id: 'antioch', name: 'Antioch', lat: 36.2021, lng: 36.16, era: 'church', reference: 'Acts 11:26', text: 'And the disciples were called Christians first in Antioch.', story: 'The first missionary church.' },
  { id: 'philippi', name: 'Philippi', lat: 41.013, lng: 24.286, era: 'church', reference: 'Acts 16:25', text: 'And at midnight Paul and Silas prayed, and sang praises unto God: and the prisoners heard them.', story: 'Songs in a prison at midnight.' },
  { id: 'athens', name: 'Athens', lat: 37.9725, lng: 23.7236, era: 'church', reference: 'Acts 17:28', text: 'For in him we live, and move, and have our being.', story: 'Paul preaches on Mars’ hill.' },
  { id: 'corinth', name: 'Corinth', lat: 37.9057, lng: 22.879, era: 'church', reference: '1 Corinthians 13:13', text: 'And now abideth faith, hope, charity, these three; but the greatest of these is charity.', story: 'A letter about love.' },
  { id: 'ephesus', name: 'Ephesus', lat: 37.9411, lng: 27.3419, era: 'church', reference: 'Ephesians 2:8', text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God.', story: 'Saved by grace.' },
  { id: 'patmos', name: 'Patmos', lat: 37.31, lng: 26.547, era: 'church', reference: 'Revelation 21:5', text: 'And he that sat upon the throne said, Behold, I make all things new.', story: 'John’s vision of the new creation.' },
  { id: 'malta', name: 'Malta', lat: 35.948, lng: 14.404, era: 'church', reference: 'Acts 28:2', text: 'And the barbarous people shewed us no little kindness.', story: 'Shipwrecked and welcomed.' },
  { id: 'rome', name: 'Rome', lat: 41.8902, lng: 12.4922, era: 'church', reference: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', story: 'Paul reaches the heart of the empire.' },
];

export interface Surrounding {
  id: string;
  label: string;
  emoji: string;
  reference: string;
  text: string;
}

export const SURROUNDINGS: Surrounding[] = [
  { id: 'mountain', label: 'Hills & mountains', emoji: '⛰️', reference: 'Psalm 121:1–2', text: 'I will lift up mine eyes unto the hills, from whence cometh my help. My help cometh from the LORD, which made heaven and earth.' },
  { id: 'sea', label: 'Sea & beach', emoji: '🌊', reference: 'Isaiah 43:2', text: 'When thou passest through the waters, I will be with thee; and through the rivers, they shall not overflow thee.' },
  { id: 'river', label: 'River & stream', emoji: '🏞️', reference: 'Psalm 1:3', text: 'And he shall be like a tree planted by the rivers of water, that bringeth forth his fruit in his season; his leaf also shall not wither.' },
  { id: 'garden', label: 'Garden & flowers', emoji: '🌸', reference: 'Matthew 6:28–29', text: 'Consider the lilies of the field, how they grow; they toil not, neither do they spin: and yet I say unto you, That even Solomon in all his glory was not arrayed like one of these.' },
  { id: 'forest', label: 'Forest & trees', emoji: '🌳', reference: 'Isaiah 55:12', text: 'For ye shall go out with joy, and be led forth with peace: the mountains and the hills shall break forth before you into singing, and all the trees of the field shall clap their hands.' },
  { id: 'farm', label: 'Farm & fields', emoji: '🌾', reference: 'Galatians 6:9', text: 'And let us not be weary in well doing: for in due season we shall reap, if we faint not.' },
  { id: 'desert', label: 'Dry places', emoji: '🏜️', reference: 'Isaiah 43:19', text: 'Behold, I will do a new thing; now it shall spring forth; shall ye not know it? I will even make a way in the wilderness, and rivers in the desert.' },
  { id: 'sky', label: 'Under the night sky', emoji: '✨', reference: 'Psalm 19:1', text: 'The heavens declare the glory of God; and the firmament sheweth his handywork.' },
  { id: 'city', label: 'In the city', emoji: '🏙️', reference: 'Jeremiah 29:7', text: 'And seek the peace of the city whither I have caused you to be carried away captives, and pray unto the LORD for it.' },
  { id: 'home', label: 'At home', emoji: '🏡', reference: 'Joshua 24:15', text: 'But as for me and my house, we will serve the LORD.' },
  { id: 'work', label: 'At work or school', emoji: '💼', reference: 'Colossians 3:23', text: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men.' },
  { id: 'hospital', label: 'Hospital or waiting room', emoji: '🏥', reference: 'Psalm 34:18', text: 'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.' },
  { id: 'church', label: 'At church', emoji: '⛪', reference: 'Psalm 122:1', text: 'I was glad when they said unto me, Let us go into the house of the LORD.' },
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
