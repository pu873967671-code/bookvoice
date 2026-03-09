export type ResourceAgeRange = '0-3' | '3-6' | '6-9' | 'all';

export type ResourceCategory =
  | '睡前故事'
  | '日常对话'
  | '儿歌短文'
  | '家长陪读'
  | '句型练习'
  | '绘本风短文';

export type ResourceSourceType = 'original' | 'curated' | 'external';

export type RecommendedMode = '一般朗读' | '睡前温和' | '儿童慢速';

export type ResourceItem = {
  id: string;
  title: string;
  summary: string;
  ageRange: ResourceAgeRange;
  category: ResourceCategory;
  sourceType: ResourceSourceType;
  recommendedMode: RecommendedMode;
  tags: string[];
  whyItFits: string;
  content?: string;
  imageUrl?: string;
  imageAlt?: string;
};

export type ResourceQuickGroup = {
  id: string;
  title: string;
  resourceIds: string[];
};

export const starterResources: ResourceItem[] = [
  // ========== 睡前故事 ==========
  {
    id: 'goodnight-bear',
    title: '晚安小熊',
    summary: '一篇节奏温和、画面安静嘅睡前短文，适合夜晚播畀小朋友听。',
    ageRange: '0-3',
    category: '睡前故事',
    sourceType: 'original',
    recommendedMode: '睡前温和',
    tags: ['睡前', '安静', '陪伴', '入睡'],
    whyItFits: '句子短、节奏慢，适合做晚安场景嘅第一批示范内容。',
    content:
      '小熊今晚有少少攰。佢抱住自己最钟意嘅小枕头，慢慢行返房。窗外有轻轻嘅风，月光照住张小床，一切都静静地。小熊合埋眼，细细声讲：晚安啦，今日辛苦晒。',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    imageAlt: '可爱的泰迪熊在床上睡觉',
  },
  {
    id: 'sleepy-stars',
    title: '瞌眼瞓嘅星星',
    summary: '一颗一颗星星慢慢瞌眼，陪小朋友一齐入睡。',
    ageRange: '0-3',
    category: '睡前故事',
    sourceType: 'original',
    recommendedMode: '睡前温和',
    tags: ['星星', '睡前', '宁静', '想象'],
    whyItFits: '重复节奏、意象温柔，适合做睡前最后一段。',
    content:
      '天上第一粒星星瞌眼瞓，慢慢眨一眨。第二粒星星都瞌眼瞓，静静闭上眼。第三粒、第四粒……一粒一粒，全部都瞌眼瞓。小朋友，你都系。晚安，好梦。',
    imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop',
    imageAlt: '夜空中的星星',
  },
  {
    id: 'cat-sleeps-too',
    title: '猫猫都瞓觉',
    summary: '睇住猫猫慢慢瞓着，小朋友都会跟住放松。',
    ageRange: '3-6',
    category: '睡前故事',
    sourceType: 'original',
    recommendedMode: '睡前温和',
    tags: ['动物', '睡前', '温柔', '放松'],
    whyItFits: '动物系小朋友最爱，配合瞓觉场景好自然。',
    content:
      '猫猫玩咗成日，依家攰攰地。佢行去自己嘅小垫度，转个圈、伸个懒腰，慢慢趴低。眼睛眯成一条线，呼吸变慢变轻。猫猫瞓着咗，你都准备好未？',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop',
    imageAlt: '猫咪蜷缩睡觉',
  },

  // ========== 日常对话 ==========
  {
    id: 'morning-before-school',
    title: '返学前嘅早晨',
    summary: '围绕起身、刷牙、着鞋、出门嘅日常短文，贴家庭生活。',
    ageRange: '3-6',
    category: '日常对话',
    sourceType: 'original',
    recommendedMode: '一般朗读',
    tags: ['返学', '早晨', '日常', '家庭'],
    whyItFits: '生活感强，家长同小朋友都容易代入，适合建立真实粤语输入。',
    content:
      '闹钟一响，妈妈轻轻叫小朋友起身。刷牙、洗面、换衫、着鞋，一样一样慢慢做。食埋早餐之后，大家一齐出门。临走之前，妈妈话：今日都要精神啲呀。',
    imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop',
    imageAlt: '小朋友准备上学',
  },
  {
    id: 'rain-is-here',
    title: '落雨啦',
    summary: '一篇短短地讲天气变化同出门准备嘅内容，易听易跟。',
    ageRange: '3-6',
    category: '日常对话',
    sourceType: 'original',
    recommendedMode: '一般朗读',
    tags: ['天气', '落雨', '出门', '生活'],
    whyItFits: '天气系最常用场景之一，实用又容易延伸成口语对话。',
    content:
      '出门之前，妈妈望一望窗外，发现天色有少少暗。未够一阵，雨点就轻轻落喺窗边。妈妈拎起把细细把伞，叫小朋友记得著好外套。落雨唔紧要，准备好就得啦。',
    imageUrl: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=400&h=300&fit=crop',
    imageAlt: '雨天窗户上的雨滴',
  },
  {
    id: 'grandma-cooks',
    title: '嫲嫲煮饭',
    summary: '厨房入面嘅声音同香味，充满家庭温暖感。',
    ageRange: '3-6',
    category: '日常对话',
    sourceType: 'original',
    recommendedMode: '一般朗读',
    tags: ['家庭', '厨房', '食物', '嫲嫲'],
    whyItFits: '港式家庭场景，有情感温度。',
    content:
      '嫲嫲喺厨房煮饭，听到镬铲炒菜嘅声音，闻到一阵阵香味。小朋友行入厨房，见到嫲嫲忙碌嘅背影。嫲嫲转头笑笑口话：就嚟食得㗎啦，去洗手先。',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    imageAlt: '厨房烹饪场景',
  },

  // ========== 儿歌短文 ==========
  {
    id: 'eat-fruits',
    title: '今日食生果',
    summary: '围绕苹果、香蕉、橙同葡萄，做一个轻松易入口嘅家庭短文。',
    ageRange: '0-3',
    category: '儿歌短文',
    sourceType: 'original',
    recommendedMode: '儿童慢速',
    tags: ['水果', '跟读', '启蒙', '食物'],
    whyItFits: '词汇简单重复，适合低龄儿童慢速跟读。',
    content:
      '今日食生果，红红地嘅苹果，黄黄地嘅香蕉，甜甜地嘅橙，同埋一粒一粒嘅葡萄。食生果，身体好，颜色又靓，味道又好。',
    imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop',
    imageAlt: '五颜六色的水果',
  },
  {
    id: 'little-bus-is-leaving',
    title: '小巴士开车啦',
    summary: '以交通工具做主角，适合低龄儿童跟住听、跟住讲。',
    ageRange: '0-3',
    category: '儿歌短文',
    sourceType: 'original',
    recommendedMode: '儿童慢速',
    tags: ['交通工具', '重复节奏', '启蒙', '低龄'],
    whyItFits: '重复结构明显，适合做慢速、清晰、儿童向语音样板。',
    content:
      '小巴士开车啦，嘟嘟嘟，慢慢行。转个弯，停一停，再继续向前。小朋友坐喺窗边望住外面，见到树、见到人、见到太阳光。',
    imageUrl: 'https://images.unsplash.com/photo-1557223562-6c77ef16210f?w=400&h=300&fit=crop',
    imageAlt: '黄色巴士',
  },
  {
    id: 'count-to-ten',
    title: '数数字一至十',
    summary: '用粤语数一至十，简单重复，易跟易记。',
    ageRange: '0-3',
    category: '儿歌短文',
    sourceType: 'original',
    recommendedMode: '儿童慢速',
    tags: ['数字', '启蒙', '跟读', '重复'],
    whyItFits: '基础数字启蒙，每个家长都需要。',
    content:
      '一、二、三，三只小鸭。四、五、六，六粒糖糖。七、八、九，九只蝴蝶。十、十、十，十个手指仔。一至十，数一次，再数多一次。',
    imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300&fit=crop',
    imageAlt: '彩色数字积木',
  },

  // ========== 家长陪读 ==========
  {
    id: 'market-day',
    title: '去街市嘅一日',
    summary: '用买菜、问价、拣水果嘅场景，带出有烟火气嘅粤语家庭内容。',
    ageRange: '6-9',
    category: '家长陪读',
    sourceType: 'original',
    recommendedMode: '一般朗读',
    tags: ['街市', '生活场景', '水果', '问价'],
    whyItFits: '场景鲜明，有港式生活感，适合拉开"有港味"呢条产品线。',
    content:
      '朝早去街市，先听到熟悉嘅叫卖声，再闻到菜档同水果档嘅香味。妈妈拣咗青菜、豆腐、番茄，同埋一袋甜甜嘅橙。小朋友跟住身边，一边睇，一边学点样问：呢个几钱呀？',
    imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop',
    imageAlt: '传统市场摊位',
  },
  {
    id: 'i-can-do-it-myself',
    title: '我自己都做到',
    summary: '围绕自己着衫、自己收拾、自己试下做，带出鼓励感。',
    ageRange: '3-6',
    category: '家长陪读',
    sourceType: 'original',
    recommendedMode: '儿童慢速',
    tags: ['自理', '鼓励', '成长', '信心'],
    whyItFits: '好适合家长朗读，语气天然偏鼓励型，产品感清晰。',
    content:
      '我想自己试下著鞋，我想自己拎书包，我想自己执返玩具。可能未必次次都做得好，但我会慢慢学。有人陪住我，我就会更有信心。',
    imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop',
    imageAlt: '小朋友自己穿鞋',
  },
  {
    id: 'first-day-school',
    title: '第一日返学',
    summary: '面对新环境嘅紧张同期待，家长陪读安抚情绪。',
    ageRange: '3-6',
    category: '家长陪读',
    sourceType: 'original',
    recommendedMode: '一般朗读',
    tags: ['返学', '情绪', '成长', '陪伴'],
    whyItFits: '每个小朋友都要面对，提前朗读可以帮助心理准备。',
    content:
      '今日系第一日返学，小朋友有少少紧张。妈妈话：唔使惊，老师会好好照顾你。入到课室，见到好多新朋友，老师笑笑口讲：欢迎你呀！小朋友深呼吸，觉得自己可以应付到。',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop',
    imageAlt: '小朋友第一天上学',
  },

  // ========== 句型练习 ==========
  {
    id: 'how-do-you-feel-today',
    title: '你今日觉得点呀？',
    summary: '用开心、攰、惊、紧张等简单词汇带出情绪表达。',
    ageRange: '3-6',
    category: '句型练习',
    sourceType: 'original',
    recommendedMode: '儿童慢速',
    tags: ['情绪', '表达', '句型', '亲子'],
    whyItFits: '适合亲子共读，亦可以直接变成互动提问模板。',
    content:
      '你今日觉得点呀？系开心，定系有少少攰？系紧张，定系想慢慢静一阵？如果你愿意，可以讲畀我听。讲出感觉，本身就已经好叻。',
    imageUrl: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=300&fit=crop',
    imageAlt: '小朋友不同的表情',
  },
  {
    id: 'what-did-you-do-today',
    title: '你今日做过咩呀？',
    summary: '一篇适合放学后对话嘅句型短文，帮助小朋友组织表达。',
    ageRange: '6-9',
    category: '句型练习',
    sourceType: 'original',
    recommendedMode: '一般朗读',
    tags: ['放学', '表达', '回顾', '对话'],
    whyItFits: '高复用场景，容易从朗读延伸到真实家庭交流。',
    content:
      '你今日做过咩呀？有冇同同学一齐玩？老师今日讲咗咩？你最记得边一件事？慢慢讲，唔使急，我想听你讲今日点样过。',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop',
    imageAlt: '家长和小朋友聊天',
  },
  {
    id: 'what-color-is-this',
    title: '呢个系咩颜色？',
    summary: '用身边物件学颜色，简单问答形式。',
    ageRange: '0-3',
    category: '句型练习',
    sourceType: 'original',
    recommendedMode: '儿童慢速',
    tags: ['颜色', '问答', '启蒙', '认知'],
    whyItFits: '颜色认知系必学基础，可以即场练习。',
    content:
      '呢个苹果系咩颜色？系红色。呢个香蕉系咩颜色？系黄色。呢个天空系咩颜色？系蓝色。颜色真多，每一样都好靓。',
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=300&fit=crop',
    imageAlt: '彩虹色的物品',
  },

  // ========== 绘本风短文 ==========
  {
    id: 'moon-and-cloud',
    title: '月亮同白云',
    summary: '有画面感嘅短篇，适合轻柔朗读，同小朋友一齐想象夜空。',
    ageRange: '3-6',
    category: '绘本风短文',
    sourceType: 'original',
    recommendedMode: '睡前温和',
    tags: ['月亮', '想象', '夜空', '绘本感'],
    whyItFits: '有简单意象，容易读出层次，亦适合做配图内容原型。',
    content:
      '今晚个月亮圆圆地挂喺天上，旁边有几片白云慢慢飘过。白云有时遮住少少月光，有时又让月亮重新发光。小朋友抬高头望住，觉得成个天都好似喺轻轻呼吸。',
    imageUrl: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400&h=300&fit=crop',
    imageAlt: '月亮和云朵',
  },
  {
    id: 'a-day-at-the-park',
    title: '公园玩一阵',
    summary: '荡秋千、滑梯、跑步、休息，一篇有动作感嘅短文。',
    ageRange: '3-6',
    category: '绘本风短文',
    sourceType: 'original',
    recommendedMode: '一般朗读',
    tags: ['公园', '动作', '户外', '画面感'],
    whyItFits: '动作多、节奏明快，适合测试一般朗读模式。',
    content:
      '去到公园，小朋友先去荡秋千，再去玩滑梯。跑一阵，笑一阵，玩到面都红晒。之后坐低饮啖水，抖一抖，再望住蓝蓝嘅天继续玩。',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    imageAlt: '儿童公园玩耍',
  },
  {
    id: 'house-above-the-clouds',
    title: '云上面间屋',
    summary: '有少少童话感嘅想象短文，适合测试更有氛围嘅朗读。',
    ageRange: '6-9',
    category: '绘本风短文',
    sourceType: 'original',
    recommendedMode: '一般朗读',
    tags: ['想象', '童话', '云朵', '氛围'],
    whyItFits: '可以拉出产品"内容有气质"嗰面，唔只系功能示范。',
    content:
      '有人话，白云上面住住一间细细嘅屋。屋前有风，屋后有光，推开门就可以见到成片天空。住喺入面嘅人唔赶时间，只会慢慢望住世界飘过。',
    imageUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&h=300&fit=crop',
    imageAlt: '云层上的想象小屋',
  },
  {
    id: 'seaside-day',
    title: '去海边玩',
    summary: '沙滩、浪声、捉蟹仔，充满夏日画面。',
    ageRange: '3-6',
    category: '绘本风短文',
    sourceType: 'original',
    recommendedMode: '一般朗读',
    tags: ['海边', '暑假', '自然', '画面感'],
    whyItFits: '夏天主题，画面丰富，适合做成有声绘本。',
    content:
      '去到海边，先听到浪声哗哗哗。小朋友脱咗鞋，赤脚踩喺软软嘅沙滩度。弯低身，喺石罅入面捉细蟹仔。浪一嚟，脚就湿一湿。阳光照落嚟，成个海闪闪发亮。',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
    imageAlt: '美丽的海滩',
  },
  {
    id: 'little-seed-grows',
    title: '小种子发芽',
    summary: '从种子到大树，讲成长过程嘅故事。',
    ageRange: '3-6',
    category: '绘本风短文',
    sourceType: 'original',
    recommendedMode: '一般朗读',
    tags: ['成长', '自然', '植物', '生命'],
    whyItFits: '成长主题有教育意义，适合反复朗读。',
    content:
      '有一粒细细粒嘅种子，跌咗喺泥土入面。落雨嗰阵，佢饮水；出太阳嗰阵，佢晒暖。一日一日过，种子发咗芽，芽变做苗，苗变成一棵细细嘅树。原来，成长需要时间同耐性。',
    imageUrl: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=300&fit=crop',
    imageAlt: '小种子发芽成长',
  },
];

export const resourceQuickGroups: ResourceQuickGroup[] = [
  {
    id: 'tonight',
    title: '今晚可以播',
    resourceIds: ['goodnight-bear', 'sleepy-stars', 'cat-sleeps-too', 'moon-and-cloud'],
  },
  {
    id: 'daily',
    title: '每日都会用到',
    resourceIds: ['morning-before-school', 'rain-is-here', 'eat-fruits', 'grandma-cooks'],
  },
  {
    id: 'follow-along',
    title: '小朋友会跟住读',
    resourceIds: ['count-to-ten', 'what-color-is-this', 'eat-fruits', 'how-do-you-feel-today'],
  },
  {
    id: 'storylike',
    title: '有画面感嘅故事',
    resourceIds: ['moon-and-cloud', 'a-day-at-the-park', 'seaside-day', 'little-seed-grows', 'house-above-the-clouds'],
  },
  {
    id: 'feelings',
    title: '情绪同成长',
    resourceIds: ['how-do-you-feel-today', 'first-day-school', 'i-can-do-it-myself'],
  },
];
