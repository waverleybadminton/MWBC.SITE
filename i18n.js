(() => {
  const storageKey = "mwbcLanguage";
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();

  const zh = {
    "Melbourne's first professional badminton centre": "墨尔本首家专业羽毛球中心",
    "Melbourne's first professional badminton centre — now expanding to 14 professional courts. Yonex mats, LED lighting, and booking that takes less than a minute.": "墨尔本首家专业羽毛球中心，现正扩建至 14 片专业球场。Yonex 地胶、LED 照明，在线订场不到一分钟。",
    "Now expanding to 14 courts": "现正扩建至 14 片球场",
    "Mount Waverley Badminton Centre is growing. We're expanding to 14 professional courts — more availability, more room for groups and schools, and the same focused, comfortable atmosphere that has always set us apart.": "Mount Waverley 羽毛球中心正在成长。我们正扩建至 14 片专业球场——更多可订时段、更充裕的团体与学校空间，同时保留一贯专注、舒适、令我们与众不同的氛围。",
    "Every court runs on Yonex badminton mats under bright, even LED lighting — true surfaces built for fast footwork and kind to knees. More courts, same private feel.": "每片球场均铺设 Yonex 专业羽毛球地胶，配以明亮均匀的 LED 照明——地面真实稳定，支撑快速步伐，也更呵护膝盖。场地更多，私享体验不变。",
    "Why MWBC": "为何选择 MWBC",
    "Melbourne's first professional badminton centre — now growing to 14 courts. Professional Yonex flooring, premium lighting, and online booking that's done in under a minute.": "墨尔本首家专业羽毛球中心——现正扩建至 14 片球场。专业 Yonex 地胶、高端照明，在线订场不到一分钟即可完成。",
    "Melbourne's first professional badminton centre — now growing to 14 courts. Professional Yonex flooring, clear glare-free lighting, and online booking that's done in under a minute.": "墨尔本首家专业羽毛球中心——现正扩建至 14 片球场。专业 Yonex 地胶、清晰无眩光的照明，在线订场不到一分钟即可完成。",
    "Every court is laid with professional Yonex mats under uniform, glare-free lighting — a true, consistent surface that's fast underfoot and easy on the knees. More courts, same private feel.": "每片球场均铺设专业 Yonex 地胶，配以均匀、无眩光的照明——地面真实一致，脚下迅捷，也更呵护膝盖。场地更多，私享体验不变。",
    "Every court at Mount Waverley Badminton Centre is finished to a professional standard — Yonex badminton mats underfoot, and uniform, high-contrast, glare-free lighting overhead. Together they give a true, consistent playing surface and a clear view of the shuttle from anywhere on court.": "Mount Waverley 羽毛球中心的每一片球场都按专业标准打造——脚下是 Yonex 专业羽毛球地胶，头顶是均匀、高对比、无眩光的照明。两者结合，带来真实一致的场地，让你在球场任何角落都能清晰看清来球。",
    "The flooring is built for comfort as much as performance, cushioning every step and easing the load on knees and ankles to help players stay on court longer with less risk of injury. The result is a comfortable, safe and genuinely professional place to play — game after game.": "地面兼顾舒适与性能，为每一步提供缓冲，减轻膝盖与脚踝的负担，让球员在场上打得更久、更少受伤。最终成就一处舒适、安全而真正专业的打球之所——每一场，都是如此。",
    "MWBC is growing to 14 professional courts — more availability for players, with the same calm, focused atmosphere the centre has always been known for. Big enough for serious play, small enough to stay comfortable.": "MWBC 正扩建至 14 片专业球场——为球员带来更多可订时段，同时保留这里一贯从容、专注的氛围。大到足以认真对决，小到依然自在舒适。",
    "Fourteen professional courts, one point of contact, and a venue that's genuinely easy to manage — serious badminton without the big-stadium noise.": "十四片专业球场、专人对接，加上真正易于管理的场馆——认真打球，却没有大型体育馆的嘈杂。",
    "More Courts, Same Private Feel": "场地更多，私享体验不变",
    "14 Courts, Private Feel": "14 片球场，依然从容私享",
    "MWBC is expanding to 14 professional courts, giving players more availability while keeping the comfortable, focused atmosphere we are known for - less overwhelming than larger stadiums and ideal for quality play.": "MWBC 扩建至 14 片专业球场，在增加可订时段的同时，仍保留我们引以为傲的舒适与专注。相比大型体育馆，这里更从容、更好专心打球。",
    "Melbourne Roots": "深厚的墨尔本根基",
    "As Melbourne's first professional badminton centre, MWBC has deep roots in Mount Waverley and a long-standing place in Victoria's badminton community.": "作为墨尔本首家专业羽毛球中心，MWBC 深深扎根 Mount Waverley，也长期是维州羽毛球社群中重要的一部分。",
    "Casual, Family & Group Bookings": "休闲、家庭与团体预订",
    "From casual court hire and family games to social groups, regular weekly bookings, corporate sessions and private group events, MWBC offers a welcoming space for players of all levels.": "从休闲约球、家庭活动，到社交团体、每周固定预订、企业活动与私人包场，MWBC 为不同水平的球员提供专业而友好的空间。",
    "Primary & High School Programs": "小学与中学项目",
    "With more courts and a manageable venue layout, MWBC is ideal for primary schools, high schools, PE classes, interschool sport, after-school programs and structured student training.": "更多球场配合清晰易管理的场馆布局，使 MWBC 尤其适合小学、中学、体育课、校际训练、课后项目与系统化学生培训。",
    "Who plays here": "谁在 MWBC 打球",
    "Live availability, clear prices, and online booking in under a minute. Prefer a quieter hit? Weekday afternoons are the calmest hours — often the whole hall to yourself.": "实时场地、价格透明，在线预订不到一分钟。想打得更清静？工作日下午是最安静的时段——常常整个球馆都归你。",
    "All levels welcome. Grab a court or two, split the cost, and make it a weekly ritual with a recurring booking on the same night each week.": "欢迎各种水平。约上一两片场地、与朋友分摊费用，再用每周固定预订，把它变成每周同一晚的固定球局。",
    "Confirmed courts, a single point of contact, and a compact venue that's easy to supervise — ideal for PE classes, school sport, staff socials and team days.": "场地提前确认、专人对接，加上便于看护的紧凑场馆——非常适合体育课、校际运动、员工活动与团队日。",
    "Predictable weekly court time, professional surfaces, and a focused, low-distraction environment — minutes from leading schools and family suburbs.": "稳定的每周场地、专业比赛级地面，以及专注、少干扰的环境——距离知名学校与家庭社区仅数分钟。",
    "Mount Waverley Badminton Centre has been part of Melbourne's badminton story from the very start. As the city's first professional centre, it has helped shape the local game across generations — for players, families, coaches and students alike.": "Mount Waverley 羽毛球中心从一开始就是墨尔本羽毛球故事的一部分。作为这座城市首家专业羽毛球中心，它陪伴一代又一代人——球员、家庭、教练与学生——共同塑造了本地的羽毛球运动。",
    "The centre sits in the heart of Mount Waverley, one of Melbourne's most established family and education corridors, close to leading schools, universities and quiet neighbourhood streets. That setting has made it a natural home for all kinds of players — casual hitters, juniors finding their feet, social groups, and competitors after a serious game.": "中心坐落于 Mount Waverley 核心地段，地处墨尔本最成熟的家庭与教育走廊之一，毗邻知名中小学、大学与宁静的住宅街区。这样的位置，让它自然成为各类球员的主场——休闲球友、初露锋芒的青少年、社交团体，以及追求认真对决的选手。",
    "Now growing to 14 professional courts, the centre is adding more room to play without losing what makes it different. Where big stadium venues can feel impersonal, MWBC stays private and personal — professional enough for serious training, yet relaxed enough for families, friends and anyone picking up a racquet again after time away.": "如今扩建至 14 片专业球场，中心在增添打球空间的同时，也守住了自己的与众不同。大型体育馆常给人疏离之感，而 MWBC 始终私密而亲切——专业得足以支撑认真训练，又轻松得让家庭、朋友，以及久别重返的人都能自在上场。",
    "It has always been more than a place to book a court. Between weekend hits, family games, coaching sessions and school programs, players build fitness, confidence and friendships here — and often a connection to the game that lasts for years.": "这里从来不只是一个订场地的地方。在周末约球、亲子游戏、教练课程与学校项目之间，球员在此锻炼体能、建立自信、结交朋友——也常常收获一份延续多年的羽毛球情缘。",
    "Local roots, a growing future, and one simple commitment behind all of it: to give every player a better place to play, train and enjoy their badminton.": "扎根本地、迈向未来，而这一切背后只有一个朴素的承诺：为每一位球员提供更好的空间，去打球、训练，真正享受羽毛球。",
    "For generations, MWBC has been a starting point for players who grow through the game — from local matches and junior training to school sport, state competition and beyond. The roots here are local, but the confidence and discipline built on these courts travel a long way further.": "多年来，MWBC 一直是许多球员成长的起点——从社区对局、青少年训练，到校际赛事、州级比赛以及更高舞台。这里的根在本地，而在这些球场上磨练出的自信与纪律，将陪伴他们走得很远很远。",
    "A Court for Every Kind of Player": "每一种热爱，都有适合的球场",
    "About MWBC": "关于 MWBC",
    "A local institution in the heart of Mount Waverley — now growing to 14 professional courts, with the same private, welcoming feel it has always had.": "扎根 Mount Waverley 的本地羽毛球主场——现正扩建至 14 片专业球场，却始终保留一贯私密、亲切的氛围。",
    "Melbourne's First Professional Badminton Centre": "墨尔本首家专业羽毛球中心",
    "Mount Waverley Badminton Centre has been part of Melbourne badminton from the beginning. As Melbourne's first professional badminton centre, MWBC has helped shape the sport's local culture through generations of players, families, coaches, students and badminton communities.": "Mount Waverley 羽毛球中心自墨尔本羽毛球运动发展的早期便扎根于此。作为墨尔本首家专业羽毛球中心，MWBC 陪伴了一代又一代球员、家庭、教练与学生成长，也参与塑造了本地独具活力的羽毛球文化。",
    "Located in the heart of Mount Waverley, MWBC sits within one of Melbourne's most established family and education corridors, surrounded by leading schools, universities, local neighbourhoods and passionate sporting communities. This has made the centre a natural home for casual players, returning players, junior athletes, social groups and serious competitors looking for a quality place to play.": "MWBC 位于 Mount Waverley 核心地段，周边汇聚优质学校、大学、成熟社区与热爱运动的家庭。得天独厚的区位，让这里自然成为休闲球友、重返球场的玩家、青少年运动员、社交团体及竞技选手都愿意长期前来的羽毛球之家。",
    "Now expanding to 14 professional courts, MWBC offers more access for players while preserving the focused, comfortable atmosphere that has always made the centre different. Unlike larger stadium-style venues, MWBC gives players a more private and personal badminton experience - professional enough for serious training, but welcoming enough for families, friends and players getting back into the game.": "如今扩建至 14 片专业球场，MWBC 在提供更多场地选择的同时，依然保留一贯专注、舒适的氛围。不同于大型体育馆式场馆，这里拥有更私享、更有人情味的打球体验：既满足专业训练的标准，也让家庭、朋友与重返球场的玩家自在投入。",
    "From weekend social hits and family games to coaching sessions, school programs and competitive pathways, MWBC continues to be more than just a place to book a court. It is a place where players build fitness, confidence, discipline, friendships and a lifelong connection to badminton.": "从周末约球、亲子活动，到教练课程、学校项目与竞技发展，MWBC 从来不只是一个订场地的地方。球员在这里锻炼体能、建立自信与纪律，也收获友谊，以及对羽毛球长久的热爱。",
    "With deep Melbourne roots and a growing future, MWBC remains committed to giving every player a better place to play, train, compete and enjoy the sport.": "扎根墨尔本，迈向更广阔的未来。MWBC 将继续为每一位球员提供更好的空间，在这里打球、训练、比赛，并真正享受羽毛球。",
    "Our pathway": "我们的成长之路",
    "From Mount Waverley to Bigger Stages": "从 Mount Waverley 走向更大舞台",
    "For generations, MWBC has been a starting point for players who grow through badminton - from local games and junior training to school sport, state competition and beyond. Our roots are local, but the confidence, discipline and sporting spirit built here travel further.": "多年来，MWBC 一直是许多球员成长的起点——从社区约球、青少年训练，到校际赛事、州级比赛以及更高舞台。我们的根在本地，而在这里培养的自信、纪律与体育精神，将陪伴球员走得更远。",
    "Melbourne's first professional badminton centre — now expanding to 14 courts in the heart of Mount Waverley.": "墨尔本首家专业羽毛球中心——现正扩建至 14 片球场，坐落于 Mount Waverley 中心。",
    "More courts. Same private feel.": "场地更多，私享体验不变。",
    "MWBC's popular times fill quickly. To keep bookings fair for everyone, courts are confirmed by prepayment.": "MWBC 的热门时段很快订满。为了对每位球员都公平，场地以预付款方式确认。",
    /* ---------- chrome & navigation ---------- */
    "Skip to court booking": "跳转至场地预订",
    ".": "。",
    "Primary navigation": "主导航",
    "Open navigation": "打开导航菜单",
    "Language": "语言选择",
    "Home": "首页",
    "The Centre": "场馆介绍",
    "Groups & Schools": "团体与学校",
    "Contact": "联系我们",
    "Book a Court": "预订场地",
    "Mount Waverley Badminton Centre": "Mount Waverley 羽毛球中心",

    /* ---------- hero ---------- */
    "Melbourne's original professional badminton centre": "墨尔本最初的专业羽毛球中心",
    "Where Mount Waverley plays.": "Mount Waverley 的主场。",
    "Six professional courts. Yonex mats, LED lighting, courts until 11pm — and booking that takes less than a minute.": "六片专业球场。Yonex 地胶、LED 照明、每晚开放至 11 点——在线订场不到一分钟。",
    "Group & school enquiries": "团体与学校咨询",
    "Next courts": "最近可订",
    "Today": "今天",
    "Tomorrow": "明天",
    "from $22/hr": "$22/小时起",
    "From $22/hr": "$22/小时起",

    /* ---------- marquee ---------- */
    "Six pro courts": "六片专业球场",
    "Yonex mats": "Yonex 专业地胶",
    "LED lighting": "LED 专业照明",
    "Open daily until 11pm": "每日开放至晚上 11 点",
    "EN / 中文 service": "中英双语服务",

    /* ---------- centre section ---------- */
    "A professional centre. Not a warehouse.": "专业场馆，而非仓库球房。",
    "Every court runs on Yonex badminton mats under bright, even LED lighting — true surfaces that hold fast footwork and go easy on knees. Six courts, never a crowd: you get your court, your game, and room to breathe.": "每片球场均铺设 Yonex 专业羽毛球地胶，配以明亮均匀的 LED 照明——地面真实稳定，支撑快速步伐，也更呵护膝盖。六片球场，从不拥挤：属于你的场地、你的比赛，和从容的空间。",
    "Melbourne's original professional badminton centre has been the local game's home for generations — trusted by families, schools, coaches and clubs across Mount Waverley and the east.": "作为墨尔本最初的专业羽毛球中心，这里陪伴了几代人的羽毛球时光——深受 Mount Waverley 及东区家庭、学校、教练与俱乐部的信赖。",
    "Professional courts": "专业球场",
    "Open nightly until": "每晚开放至",
    "Quiet hours from": "安静时段低至",
    "More about the centre": "了解场馆",

    /* ---------- segments ---------- */
    "Find your game": "找到属于你的打法",
    "Made for the way you play": "为你的打法而设计",
    "Casual players": "休闲球友",
    "Turn up. Play. Done.": "到场、开打、尽兴。",
    "Live availability, clear prices, book online in under a minute. Quiet court hours on weekday afternoons if you like the hall to yourself.": "实时场地、价格透明，在线预订不到一分钟。工作日下午的安静时段，让你独享整个球馆的从容。",
    "Social & family groups": "亲友与家庭团体",
    "Your weekly game, sorted.": "每周球局，一次搞定。",
    "Mixed levels welcome. Book a court or two, split the cost, and lock in the same night every week with a recurring booking.": "欢迎不同水平同场。订一两片场地、朋友分摊费用，还可设置每周固定预订，锁定同一晚的球局。",
    "Ask about recurring bookings": "咨询每周固定预订",
    "Corporate & schools": "企业与学校",
    "Group hire, professionally run.": "专业运营的团体包场。",
    "Confirmed courts, one point of contact, and a compact venue that's easy to supervise — for PE classes, school sport, staff socials and team days.": "场地提前确认、专人对接，紧凑场馆便于管理与看护——适合体育课、校际运动、员工活动与团队日。",
    "Enquire About Group Hire": "咨询团体包场",
    "Coaches & squads": "教练与训练队",
    "A serious training base.": "认真训练的主场。",
    "Predictable weekly court access, professional surfaces and a focused environment — minutes from leading schools and family suburbs.": "稳定可预期的每周场地、专业比赛级地面与专注环境——距离知名学校与家庭社区仅数分钟。",
    "Enquire About Coaching Partnerships": "咨询教练合作",

    /* ---------- kinetic band ---------- */
    "Fast game. Faster booking.": "球快。订场更快。",
    "Pick a time, pay online, walk on court. No calls, no waiting, no fuss.": "选好时间、在线支付、直接上场。无需电话，无需等待，毫不费事。",

    /* ---------- comeback ---------- */
    "From our players": "球员心声",
    "\"I hadn't played in years and the big stadium centres felt intimidating. Here it's quiet and personal — you book, you play, and nobody's watching. Getting back into badminton was actually fun.\"": "“我好多年没打球了，大型场馆总让人却步。这里安静又自在——订好场就打，没有人围观。重新开始打羽毛球，原来真的很开心。”",
    "A better place to get back into badminton": "重拾羽毛球的更好去处",
    "\"I hadn't played in years and the big stadium centres felt intimidating. Here there are only six courts — it's quiet, it's personal, nobody's watching. You book, you play. Getting back into badminton was actually fun.\"": "“我好多年没打球了，大型场馆总让人却步。这里只有六片球场——安静、自在，没有人围观。订好场就打。重新开始打羽毛球，原来真的很开心。”",
    "Returning player, Mount Waverley": "重返球场的球员，Mount Waverley",
    "Haven't played in years? Perfect. Start here.": "多年没打球？没关系，从这里开始正好。",
    "Book Your Comeback Court": "预订你的回归之战",

    /* ---------- visit ---------- */
    "Visit us": "欢迎到访",
    "Easy to find. Easy to book.": "地点好找，订场轻松。",
    "Address": "地址",
    "Hours": "营业时间",
    "Monday-Friday": "周一至周五",
    "Saturday-Sunday": "周六至周日",
    "9am-11pm": "上午 9 点至晚上 11 点",
    "8am-11pm": "上午 8 点至晚上 11 点",
    "Phone": "电话",
    "Email": "电子邮箱",
    "Send an Enquiry": "提交咨询",
    "Map of Mount Waverley Badminton Centre": "Mount Waverley 羽毛球中心地图",
    "Open in Google Maps": "在 Google 地图中打开",

    /* ---------- court hire page ---------- */
    "Court hire": "场地预订",
    "Book a court": "预订场地",
    "Live availability. Instant confirmation. From $22 an hour.": "实时场地，即时确认，每小时 $22 起。",
    "Court hire rates": "场地价格",
    "Quiet court hours · weekdays before 5pm": "安静时段 · 工作日下午 5 点前",
    "Off-peak hours · weekdays before 5pm": "非高峰时段 · 工作日下午 5 点前",
    "Off-peak hours from": "非高峰时段低至",
    "Inside Mount Waverley Badminton Centre — professional Yonex courts": "Mount Waverley 羽毛球中心内景——专业 Yonex 球场",
    "Front entrance of Mount Waverley Badminton Centre": "Mount Waverley 羽毛球中心正门",
    "Ground-level view of the professional courts at Mount Waverley Badminton Centre": "Mount Waverley 羽毛球中心专业球场近景",
    "On the court": "球场上",
    "Fourteen courts, built for real play": "十四片球场，为真正的比赛而建",
    "Professional surfaces, tournament-grade lighting, and room for squads, schools and clubs to train properly.": "专业地胶、赛事级灯光，为球队、学校与俱乐部提供充足的训练空间。",
    "Where local players find their game": "本地球员在这里找到自己的节奏",
    "From first social hits to competitive doubles, the centre has been a starting point for Mount Waverley players for years — a comfortable place to learn the game and a serious one to master it.": "从最初的休闲对拉到竞技双打，多年来这里一直是 Mount Waverley 球员的起点——既适合轻松入门，也能让人认真钻研球技。",
    "Doubles pair at the net during a competition match": "双打组合在比赛中于网前对抗",
    "The Mount Waverley Badminton Centre courts": "Mount Waverley 羽毛球中心球场",
    "Peak · evenings, weekends & public holidays": "高峰时段 · 晚间、周末及公共假期",
    "Open daily": "每日开放",
    "Weekdays 9am-11pm · weekends 8am-11pm": "工作日 9am-11pm · 周末 8am-11pm",
    "Online court booking": "在线场地预订",
    "Fair booking, guaranteed courts": "公平预订，场地保障",
    "MWBC has six courts and popular times fill quickly. To keep bookings fair for everyone, courts are confirmed by prepayment.": "MWBC 共有六片球场，热门时段很快订满。为了对每位球员都公平，场地以预付款方式确认。",
    "Changes must be made before your cancellation window — 24 hours' notice per court for weekday bookings, and 48 hours per court for weekends and public holidays. A $5 cancellation fee applies to all bookings, and no-shows are charged in full because the court was held exclusively for your group.": "如需改期，请在取消期限之前操作——工作日预订每片场地需提前 24 小时通知，周末及公共假期每片场地需提前 48 小时。所有预订均收取 5 澳元取消费，未到场将全额收费，因为该场地已为你的团体专属保留。",
    "A $5 cancellation fee applies to all bookings.": "所有预订均收取 5 澳元取消费。",

    /* ---------- booking widget ---------- */
    "Booking progress": "预订进度",
    "Date": "日期",
    "Time": "时间",
    "Details": "资料",
    "Confirm": "确认",
    "Court hire details": "预订详情",
    "Duration": "时长",
    "60 minutes": "60 分钟",
    "90 minutes": "90 分钟",
    "120 minutes": "120 分钟",
    "150 minutes": "150 分钟",
    "3 hours": "3 小时",
    "3.5 hours": "3.5 小时",
    "4 hours": "4 小时",
    "4.5 hours": "4.5 小时",
    "5 hours": "5 小时",
    "Up to 5 hours online. For longer bookings, please send an enquiry.": "线上最长可预订 5 小时。如需更长时段，请提交咨询。",
    "Number of courts": "场地数量",
    "1 court": "1 片场地",
    "2 courts": "2 片场地",
    "3 courts": "3 片场地",
    "4 courts": "4 片场地",
    "For 5+ courts, please send an enquiry so the team can arrange the booking.": "如需 5 片或以上场地，请提交咨询，由团队协助安排。",
    "Choose a date and time": "选择日期与时间",
    "Previous month": "上个月",
    "Next month": "下个月",
    "Month": "月份",
    "Mon": "周一",
    "Tue": "周二",
    "Wed": "周三",
    "Thu": "周四",
    "Fri": "周五",
    "Sat": "周六",
    "Sun": "周日",
    "Available booking dates": "可预订日期",
    "Calendar legend": "日历图例",
    "Selected": "已选择",
    "Available": "可预订",
    "Unavailable": "已满",
    "Closed": "已关闭",
    "Select a date": "请选择日期",
    "All": "全部",
    "Morning": "上午",
    "Afternoon": "下午",
    "Evening": "晚上",
    "Your details": "联系资料",
    "Name": "姓名",
    "Your name": "请输入姓名",
    "Payment methods": "付款方式",
    "Card": "银行卡",
    "Prepayment secures your court and helps keep booking times fair for all players.": "预付款可锁定场地，也能让预订时段对所有球员更公平。",
    "Booking changes and cancellation policy": "预订变更与取消政策",
    "24h weekday / 48h weekend changes": "工作日提前 24 小时／周末提前 48 小时变更",
    "Weekday changes require 24 hours' notice per court. Weekend and public holiday changes require 48 hours' notice per court. Example: 2 weekend courts require 4 days' notice.": "工作日改期需按每片场地提前 24 小时通知；周末及公共假期需按每片场地提前 48 小时通知。例如：周末预订 2 片场地，需提前 4 天通知。",
    "I agree to the booking change and cancellation policy.": "我已阅读并同意预订变更与取消政策。",
    "Pick an available time": "请选择可预订时段",
    "Change notice": "改期通知期",
    "Select courts": "请选择场地",
    "Total": "合计",
    "Confirm Booking": "确认预订",

    /* ---------- confirmation ---------- */
    "Booking complete": "预订已完成",
    "You're on court": "订场成功",
    "Your court hire is reserved. Review the details below.": "您的场地已成功保留，请核对以下预订资料。",
    "Booking reference": "预订编号",
    "Start time": "开始时间",
    "Courts": "场地",
    "Confirmation details will be sent to": "确认信息将发送至",
    "your email": "您的电子邮箱",
    "Book another court": "继续预订场地",
    "Contact MWBC": "联系 MWBC",

    /* ---------- groups & schools ---------- */
    "Groups, schools & coaching": "团体、学校与教练",
    "Group hire that runs itself": "省心省力的团体包场",
    "Six professional courts, one point of contact, and a compact venue that's genuinely easy to manage — serious badminton without big-stadium noise.": "六片专业球场、专人对接，加上紧凑易管理的场馆布局——认真打球，却没有大型体育馆的嘈杂。",
    "Plan your booking": "规划您的活动",
    "A better fit for organised play": "更适合有组织的团体活动",
    "Corporate & Team Days": "企业活动与团队日",
    "Workplace socials, team building and end-of-year celebrations. Courts confirmed in advance; the whole visit stays simple to run.": "员工社交、团队建设与年末庆祝活动。场地提前确认，整个活动轻松顺畅。",
    "Primary & High Schools": "小学与中学",
    "PE classes, interschool sport and after-school programs. A compact layout keeps students visible and sessions on schedule.": "体育课、校际运动与课后项目。紧凑的场馆布局让学生始终在视线之内，课程安排井然有序。",
    "Coaches & Training Squads": "教练与训练队",
    "Predictable weekly court access and professional surfaces for squads and private coaching, in a focused, low-distraction environment.": "为训练队与私人教学提供稳定的每周场地与专业比赛级地面，环境专注、少有干扰。",
    "Social & Community Groups": "社交与社区团体",
    "Regular weekly bookings for clubs and community groups — same night, same courts, all season.": "为俱乐部与社区团体提供每周固定预订——固定的晚上、固定的场地，整季无忧。",
    "Tell us what you need": "告诉我们您的需求",
    "We'll shape the right court plan": "我们为您规划合适的场地方案",
    "Send your preferred days, session length, number of courts and approximate group size — we'll come back with a plan that fits.": "请提供理想日期、活动时长、所需场地数量与大致人数——我们会为您量身规划合适的方案。",

    /* ---------- the centre (about) ---------- */
    "Big enough for serious play. Small enough to feel personal.": "足以认真对决，小到亲切自在。",
    "Our story": "我们的故事",
    "Mount Waverley Badminton Centre has been part of Melbourne badminton from the beginning. As Melbourne's original professional badminton centre, MWBC has helped shape the local game through generations of players, families, coaches and students.": "Mount Waverley 羽毛球中心自墨尔本羽毛球运动发展的早期便扎根于此。作为墨尔本最初的专业羽毛球中心，MWBC 陪伴了一代又一代球员、家庭、教练与学生成长，也参与塑造了本地的羽毛球文化。",
    "We sit in the heart of Mount Waverley, in one of Melbourne's most established family and education corridors — close to leading schools, universities and family neighbourhoods. That has made the centre a natural home for casual players, returning players, juniors, social groups and serious competitors alike.": "我们位于 Mount Waverley 核心地段，地处墨尔本最成熟的家庭与教育走廊之一，毗邻知名中小学、大学与宜居社区。得天独厚的区位，让这里自然成为休闲球友、重返球场的玩家、青少年、社交团体与竞技选手共同的羽毛球之家。",
    "MWBC has six professional courts — and that is deliberate. Fewer courts means a quieter hall, easier bookings to manage, and a more private, personal game. Professional enough for serious training; welcoming enough for families, friends and anyone picking up a racquet again.": "MWBC 拥有六片专业球场——这是我们有意的选择。球场少，意味着场馆更安静、预订更好安排，打球也更私密、更有人情味。专业程度足以支撑认真训练，氛围又足够亲和，欢迎家庭、朋友以及每一位重新拿起球拍的人。",
    "More than a place to book a court, MWBC is where players build fitness, confidence, discipline and friendships — and a lifelong connection to badminton.": "MWBC 不只是一个订场地的地方。球员在这里锻炼体能、建立自信与纪律，收获友谊，也建立起与羽毛球一生的联结。",
    "Built for the game": "为羽毛球而打造",
    "At Mount Waverley Badminton Centre, we take real pride in the quality of our courts. Every one is finished with professional Yonex mats and bright, even LED lighting — a true, consistent surface that makes the game feel effortless, whatever your level.": "在 Mount Waverley 羽毛球中心，我们对场地品质有着由衷的自豪。每一片球场都铺设专业 Yonex 地胶，配以明亮均匀的 LED 照明——地面真实一致，无论你的水平如何，都能让打球更得心应手。",
    "The flooring is built for comfort as much as performance. It cushions every step, eases the load on your knees and ankles, and helps you play longer with less risk of injury. Step onto our courts and enjoy a comfortable, safe and genuinely professional place to play — every single game.": "地面在追求出色性能的同时，同样注重舒适。它为每一步提供缓冲，减轻膝盖与脚踝的负担，让你打得更久、更少受伤。踏上我们的球场，在舒适、安全而真正专业的环境中，尽情享受每一场比赛。",
    "Professional courts, private feel": "专业球场，私享氛围",
    "Every court runs on Yonex badminton mats under bright, even LED lighting — a consistent, true-playing surface that supports fast footwork and reduces strain on knees and ankles.": "每片球场均铺设 Yonex 专业羽毛球地胶，配以明亮均匀的 LED 照明——地面稳定真实，支撑快速步伐，减轻膝盖与脚踝的负担。",
    "Whether it's a casual hit, a coaching session or competitive training, you get professional playing conditions in a hall that feels focused and calm.": "无论是朋友约球、教练课程还是竞技训练，你都能在专注而从容的场馆里，享受专业级的打球条件。",

    /* ---------- contact ---------- */
    "Talk to the team": "联系我们的团队",
    "For group hire, school bookings, coaching blocks or regular weekly courts, tell us your preferred days and group size — we'll reply promptly.": "如需团体包场、学校预订、教练时段或每周固定场地，请告诉我们理想的日期与人数，我们会尽快回复。",
    "Contact details and enquiry form": "联系方式与咨询表格",
    "Group & school enquiries": "团体与学校咨询",
    "Send an enquiry": "提交咨询",
    "Enquiry": "咨询内容",
    "Tell us your preferred day, time, and group size": "请告诉我们理想日期、时间与团体人数",
    "Send Enquiry": "提交咨询",
    "Thanks. Your enquiry has been received and the MWBC team will be in touch.": "感谢您的咨询。MWBC 团队已收到信息，将尽快与您联系。",

    /* ---------- footer ---------- */
    "Melbourne's original professional badminton centre — six courts in the heart of Mount Waverley.": "墨尔本最初的专业羽毛球中心——六片专业球场，坐落于 Mount Waverley 中心。",
    "Explore": "网站导航",
    "Bookings & policies": "预订与政策",
    "Group & School Enquiries": "团体与学校咨询",
    "Booking & Cancellation Policy": "预订变更与取消政策",
    "Staff Login": "员工登录",
    "Six courts. Serious badminton. Less pressure.": "六片球场。认真打球。没有压力。",
    "Competition photography via Wikimedia Commons —": "比赛摄影来自 Wikimedia Commons —",

    /* ---------- admin ---------- */
    "Staff access": "员工入口",
    "Best fit — keeps courts gap-free": "最佳时段——让场地不留空档",
    "Best fit": "最佳时段",
    "best fit": "最佳时段",
    "leaves a short gap": "会留下一小段空档",
    "Auto — best available": "自动（分配最佳可用场地）",
    "Reserved": "已预留",
    "Leave on Auto to allocate the best available court.": "保持“自动”即可分配最合适的空闲场地。",
    "Doubles pair mid-rally on a competition court": "双打组合在比赛场地上激烈对攻",
    "Badminton doubles rally on a professional court": "专业球场上的羽毛球双打对攻",
    "Call 0452 242 399": "致电 0452 242 399",
    "← Back to the main site": "← 返回主站",
    "Demo access — username: admin · password: MWBC2026 (already filled in)": "演示登录 — 用户名：admin · 密码：MWBC2026（已自动填写）",
    "Click any empty slot to add a booking. Click a booking to edit, cancel or refund it.": "点击任意空闲时段即可新增预订；点击已有预订可编辑、取消或退款。",
    "Add a booking": "新增预订",
    "Click any empty slot on the board": "点击场地表中任意空闲时段",
    "Pick a court and time, set the details, and confirm.": "选择场地与时间，填写资料并确认。",
    "+ New booking": "+ 新增预订",
    "Players mid-rally on a full badminton court": "球员在整片羽毛球场上激烈对抗",
    "No bookings for this day yet. Click any empty slot above to add one.": "当天暂无预订。点击上方任意空闲时段即可新增。",
    "Cancel this booking and free the court?": "取消该预订并释放场地？",
    "Clear all demo bookings? This cannot be undone.": "清除所有演示预订？此操作无法撤销。",
    "Admin login": "后台登录",
    "Sign in to manage court bookings and phone reservations.": "登录后台，管理场地订单与电话预订。",
    "Username": "用户名",
    "Password": "密码",
    "Sign in": "登录",
    "Operations": "运营管理",
    "Daily court schedule": "每日场地安排",
    "See every court at a glance, add phone bookings, and keep online and manual reservations in one place.": "一目了然查看所有场地、录入电话预订，并统一管理线上与人工订单。",
    "Log out": "退出登录",
    "Booking metrics": "预订数据",
    "Bookings": "预订数量",
    "Revenue": "营业额",
    "Average utilisation": "平均使用率",
    "Refund queue": "待处理退款",
    "Badminton": "羽毛球",
    "Court board": "场地总览",
    "Select adjacent half-hour squares on one court. Minimum booking is 1 hour.": "在同一片场地选择相邻的半小时时段；每次最少预订 1 小时。",
    "Schedule date controls": "日期控制",
    "Previous day": "前一天",
    "Next day": "后一天",
    "Quick date selection": "快速选择日期",
    "Court schedule": "场地安排",
    "Booking colour legend": "预订颜色图例",
    "Online": "线上预订",
    "Phone/manual": "电话／人工预订",
    "Unpaid/hold": "未付款／保留",
    "Selected booking": "已选时段",
    "Choose time squares": "请选择时段",
    "Select at least two adjacent squares.": "请至少选择两个相邻时段。",
    "Clear": "清除",
    "Enter details": "填写资料",
    "Court booking schedule": "场地预订时间表",
    "Close booking form": "关闭预订表格",
    "Phone reservation": "电话预订",
    "New booking": "新增预订",
    "Customer": "客户姓名",
    "Customer name": "请输入客户姓名",
    "Court": "场地",
    "For 5+ courts, use enquiry/group booking.": "如需 5 片或以上场地，请使用团体咨询。",
    "For bookings longer than 5 hours, use enquiry/group booking.": "如需预订超过 5 小时，请使用团体咨询。",
    "Status": "状态",
    "Paid": "已付款",
    "Unpaid": "未付款",
    "Hold": "暂时保留",
    "Notes": "备注",
    "e.g. regular, group, deposit": "例如：固定预订、团体、订金",
    "Add Booking": "添加预订",
    "Update Booking": "更新预订",
    "Edit booking": "编辑预订",
    "Edit": "编辑",
    "Invoice": "发票",
    "Print / Save as PDF": "打印 / 存为 PDF",
    "Past": "过往",
    "Past bookings": "过往预订",
    "No past bookings.": "暂无过往预订。",
    "Delete": "删除",
    "(no name)": "（无姓名）",
    "This booking is marked PAID — deleting removes the record and does NOT refund the customer.": "此预订状态为“已付款”——删除只会移除记录，不会退款给客户。",
    "Delete this booking? This can't be undone.": "确定删除此预订吗？此操作无法撤销。",
    "Couldn't delete. Please try again.": "删除失败，请重试。",
    "⛶ Full screen": "⛶ 全屏",
    "Exit full screen": "退出全屏",
    "Customers": "客户",
    "Total paid": "已付总额",
    "Last visit": "最近预订",
    "No customers yet.": "暂无客户。",
    "No customers match your search.": "没有匹配的客户。",
    "Online booking is opening soon": "在线预订即将开放",
    "To book a court today, call or email us and we'll lock it in for you.": "如需今天预订场地，请致电或邮件联系我们，我们会为您锁定。",
    "Call 0452 242 399": "致电 0452 242 399",
    "Online booking is opening soon — please call 0452 242 399 to book.": "在线预订即将开放——请致电 0452 242 399 预订。",
    "Booked by us": "我们代订",
    "Repeat weekly": "每周重复",
    "Just this date": "仅此日期",
    "Weekly for 2 weeks": "连续 2 周",
    "Weekly for 4 weeks": "连续 4 周",
    "Weekly for 8 weeks": "连续 8 周",
    "Weekly for 12 weeks": "连续 12 周",
    "Repeats the same time and court on the following weeks.": "在接下来的几周以相同时间和场地重复预订。",
    "Cancel this booking": "取消此预订",
    "+ School booking": "+ 学校预订",
    "School / group booking": "学校／团体预订",
    "New school booking": "新增学校预订",
    "Edit school booking": "编辑学校预订",
    "Update booking": "更新预订",
    "School name": "学校名称",
    "Contact name": "联系人姓名",
    "Contact email": "联系邮箱",
    "Contact phone": "联系电话",
    "Contact": "联系方式",
    "School / group name": "学校／团体名称",
    "Booking reference": "预订编号",
    "Paste an email to auto-fill": "粘贴邮件以自动填充",
    "Paste the customer's email (with their dates/times) and we'll fill in what we can — everything stays editable.": "粘贴客户邮件（含日期／时间），系统会尽量自动填充，所有内容仍可编辑。",
    "Paste the whole email here…": "在此粘贴整封邮件…",
    "Auto-fill from email": "从邮件自动填充",
    "Paste an email first.": "请先粘贴邮件。",
    "Sessions": "场次",
    "+ Add session": "+ 添加场次",
    "Courts": "场地数",
    "$/court": "每场价格（$）",
    "Session price": "场次价格",
    "$/court/hr": "每场每小时（$）",
    "Item": "项目",
    "Amount": "金额",
    "e.g. shuttlecocks, equipment hire": "例如：羽毛球、器材租借",
    "Additional items (optional)": "附加项目（可选）",
    "+ Add item": "+ 添加项目",
    "Create booking": "创建预订",
    "Quote (total)": "报价（总计）",
    "Auto-calculated from sessions; edit for an agreed price.": "根据场次自动计算；可手动修改为商定价格。",
    "School": "学校",
    "School bookings": "学校预订",
    "School booking confirmation": "学校预订确认",
    "Confirmation email": "确认邮件",
    "Ready to send to the school. Copy it, or open a pre-filled Gmail draft.": "可发送给学校。复制内容，或打开已填好的 Gmail 草稿。",
    "Copy email": "复制邮件",
    "Open in Gmail": "在 Gmail 中打开",
    "Copied.": "已复制。",
    "Add at least one session.": "请至少添加一个场次。",
    "No school bookings yet.": "暂无学校预订。",
    "Remove this school booking and free all its courts?": "删除该学校预订并释放其所有场地？",
    "Couldn't remove. Please try again.": "删除失败，请重试。",
    "School bookings are managed in the School bookings list below.": "学校预订请在下方的“学校预订”列表中管理。",
    "Bookings for selected day": "所选日期的预订",
    "Bookings": "预订",
    "All upcoming bookings": "所有即将到来的预订",
    "This day": "当天",
    "All upcoming": "全部即将到来",
    "No upcoming bookings.": "暂无即将到来的预订。",
    "Court board": "场地表",
    "Now": "现在",
    "Morning": "上午",
    "Afternoon": "下午",
    "Evening": "晚上",
    "Used": "使用率",
    "Pick a date": "选择日期",
    "Click an empty slot to add a booking · click a booking to edit, cancel or refund.": "点击空闲时段可新增预订 · 点击已有预订可编辑、取消或退款。",
    "Clear Demo Data": "清除演示数据",
    "Contact details": "联系方式",
    "Source": "来源",
    "Amount": "金额",
    "Action": "操作",
    "Username or password is incorrect.": "用户名或密码不正确。",
    "Email": "邮箱",
    "Signing in…": "正在登录…",
    "Email or password is incorrect.": "邮箱或密码不正确。",
    "Securing your court…": "正在为您锁定场地…",
    "Saving…": "正在保存…",
    "Sorry — that time was just taken. Please choose another slot.": "抱歉，该时段刚刚被预订。请另选时间。",
    "Something went wrong creating your booking. Please try again.": "创建预订时出现问题，请重试。",
    "Bookings are offline right now. Please try again in a moment.": "预订系统暂时离线，请稍后再试。",
    "Couldn't cancel that booking. Please try again.": "无法取消该预订，请重试。",
    "Refund −$5": "退款（扣 $5）",
    "Refund this customer minus the $5 cancellation fee, and free the court?": "为该客户退款（扣除 $5 取消费）并释放场地？",
    "Refund complete.": "退款完成。",
    "Confirm & Pay": "确认并支付",
    "Taking you to secure checkout…": "正在跳转到安全支付页面…",
    "Something went wrong starting checkout. Please try again.": "启动支付时出现问题，请重试。",
    "Payment was cancelled — your court wasn't booked. You can try again.": "支付已取消——尚未预订场地。您可以重试。",
    "Confirming your payment…": "正在确认您的付款…",
    "Payment received — your court is confirmed. Details below.": "已收到付款——场地已确认。详情如下。",
    "A small card processing fee is added at checkout.": "结账时将收取少量银行卡手续费。",
    "Select at least one adjacent square to reach the 1-hour minimum.": "请再选择一个相邻时段，以满足最少 1 小时的预订要求。",
    "Five-hour maximum selected.": "已选择线上预订最长时段：5 小时。",
    "Select more adjacent squares or enter the booking details.": "可继续选择相邻时段，或填写预订资料。",
    "No bookings for this day yet. Add a phone booking or create one from the public booking page.": "当天暂无预订。您可以添加电话预订，或从公开预订页面创建订单。",
    "Manual": "人工录入",
    "Remove": "删除",
    "No start times are available in this period. Try another time of day or date.": "该时段暂无可预订时间，请尝试其他时段或日期。",
    "Choose an available time to continue.": "请选择可预订时段后继续。",
    "Please agree to the booking change and cancellation policy before booking.": "确认预订前，请先同意预订变更与取消政策。"
  };

  const metadata = {
    en: {
      title: "Mount Waverley Badminton Centre | Book a Court",
      description: "Melbourne's first professional badminton centre, now growing to 14 courts in Mount Waverley. Professional Yonex flooring, premium lighting, and online booking in under a minute. EN / 中文.",
      ogDescription: "Melbourne's first professional badminton centre, now growing to 14 courts. Professional courts, premium lighting, book online in under a minute."
    },
    zh: {
      title: "Mount Waverley 羽毛球中心｜在线订场",
      description: "墨尔本首家专业羽毛球中心，现正扩建至 14 片球场，坐落于 Mount Waverley。专业 Yonex 地胶、高端照明，在线订场不到一分钟。中英双语。",
      ogDescription: "墨尔本首家专业羽毛球中心，现正扩建至 14 片球场。专业场地、高端照明，在线订场不到一分钟。"
    }
  };
  const enByZh = new Map(Object.entries(zh).map(([english, chinese]) => [chinese, english]));

  let language = readStoredLanguage();

  function readStoredLanguage() {
    try {
      return localStorage.getItem(storageKey) === "zh" ? "zh" : "en";
    } catch {
      return "en";
    }
  }

  function interpolate(value, variables = {}) {
    return String(value).replace(/\{(\w+)\}/g, (_, key) => variables[key] ?? "");
  }

  function t(key, variables) {
    const value = language === "zh" ? (zh[key] || key) : key;
    return interpolate(value, variables);
  }

  function locale() {
    return language === "zh" ? "zh-CN" : "en-AU";
  }

  function translateTextNode(node) {
    if (!textSources.has(node)) {
      const current = node.nodeValue;
      const match = current.match(/^(\s*)([\s\S]*?)(\s*)$/);
      const english = match ? enByZh.get(match[2]) : null;
      textSources.set(node, english ? `${match[1]}${english}${match[3]}` : current);
    }
    const source = textSources.get(node);
    if (language === "en") {
      node.nodeValue = source;
      return;
    }

    const match = source.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match || !match[2]) return;
    const translated = zh[match[2]];
    node.nodeValue = translated ? `${match[1]}${translated}${match[3]}` : source;
  }

  function sourceAttribute(element, attribute) {
    let sources = attributeSources.get(element);
    if (!sources) {
      sources = new Map();
      attributeSources.set(element, sources);
    }
    if (!sources.has(attribute)) {
      const current = element.getAttribute(attribute);
      sources.set(attribute, enByZh.get(current) || current);
    }
    return sources.get(attribute);
  }

  function translateAttribute(element, attribute) {
    const source = sourceAttribute(element, attribute);
    if (source == null) return;
    element.setAttribute(attribute, language === "zh" && zh[source] ? zh[source] : source);
  }

  function translateTree(root = document) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentElement?.closest("script, style, noscript")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateTextNode);

    root.querySelectorAll("[placeholder], [aria-label], [title], img[alt]").forEach((element) => {
      ["placeholder", "aria-label", "title", "alt"].forEach((attribute) => {
        if (element.hasAttribute(attribute)) translateAttribute(element, attribute);
      });
    });
  }

  function updateMetadata() {
    const values = metadata[language];
    document.title = values.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", values.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", language === "zh" ? "Mount Waverley 羽毛球中心" : "Mount Waverley Badminton Centre");
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", values.ogDescription);
  }

  function syncButtons() {
    document.querySelectorAll("button[data-language]").forEach((button) => {
      const active = button.dataset.language === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setLanguage(nextLanguage, options = {}) {
    language = nextLanguage === "zh" ? "zh" : "en";
    try {
      localStorage.setItem(storageKey, language);
    } catch {
      // Language selection still works for this visit when storage is unavailable.
    }
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.documentElement.dataset.language = language;
    updateMetadata();
    translateTree(document);
    syncButtons();
    if (options.notify !== false) {
      window.dispatchEvent(new CustomEvent("mwbc-language-changed", { detail: { language } }));
    }
  }

  window.MWBC_I18N = {
    getLanguage: () => language,
    isChinese: () => language === "zh",
    locale,
    setLanguage,
    t,
    translateTree
  };

  document.querySelectorAll("button[data-language]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.language));
  });

  setLanguage(language, { notify: false });
})();
