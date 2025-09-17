import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  onScheduleMessage: (message: string, files: File[] | undefined, scheduledFor: Date) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Enhanced Emoji picker component with Teams-like functionality
const EmojiPicker = ({ onEmojiSelect, isOpen, onClose }: { onEmojiSelect: (emoji: string) => void; isOpen: boolean; onClose: () => void }) => {
  const [selectedCategory, setSelectedCategory] = useState('recent');
  
  const emojiCategories = {
    recent: ['😀', '😊', '👍', '❤️', '😂', '😍', '🎉', '🔥'],
    people: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
    gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'],
    objects: ['💎', '🔔', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧴', '🧷', '🧸', '🧵', '🧶', '🪡', '🪢', '🪣', '🪤', '🪥', '🪦', '🪧', '🪨', '🪩', '🪪', '🪫', '🪬', '🪭', '🪮', '🪯', '🪰', '🪱', '🪲', '🪳', '🪴', '🪵', '🪶', '🪷', '🪸', '🪹', '🪺', '🪻', '🪼', '🪽', '🪾', '🪿', '🫀', '🫁', '🫂', '🫃', '🫄', '🫅', '🫆', '🫇', '🫈', '🫉', '🫊', '🫋', '🫌', '🫍', '🫎', '🫏', '🫐', '🫑', '🫒', '🫓', '🫔', '🫕', '🫖', '🫗', '🫘', '🫙', '🫚', '🫛', '🫜', '🫝', '🫞', '🫟', '🫠', '🫡', '🫢', '🫣', '🫤', '🫥', '🫦', '🫧', '🫨', '🫩', '🫪', '🫫', '🫬', '🫭', '🫮', '🫯', '🫰', '🫱', '🫲', '🫳', '🫴', '🫵', '🫶', '🫷', '🫸', '🫹', '🫺', '🫻', '🫼', '🫽', '🫾', '🫿', '🬀', '🬁', '🬂', '🬃', '🬄', '🬅', '🬆', '🬇', '🬈', '🬉', '🬊', '🬋', '🬌', '🬍', '🬎', '🬏', '🬐', '🬑', '🬒', '🬓', '🬔', '🬕', '🬖', '🬗', '🬘', '🬙', '🬚', '🬛', '🬜', '🬝', '🬞', '🬟', '🬠', '🬡', '🬢', '🬣', '🬤', '🬥', '🬦', '🬧', '🬨', '🬩', '🬪', '🬫', '🬬', '🬭', '🬮', '🬯', '🬰', '🬱', '🬲', '🬳', '🬴', '🬵', '🬶', '🬷', '🬸', '🬹', '🬺', '🬻', '🬼', '🬽', '🬾', '🬿', '🭀', '🭁', '🭂', '🭃', '🭄', '🭅', '🭆', '🭇', '🭈', '🭉', '🭊', '🭋', '🭌', '🭍', '🭎', '🭏', '🭐', '🭑', '🭒', '🭓', '🭔', '🭕', '🭖', '🭗', '🭘', '🭙', '🭚', '🭛', '🭜', '🭝', '🭞', '🭟', '🭠', '🭡', '🭢', '🭣', '🭤', '🭥', '🭦', '🭧', '🭨', '🭩', '🭪', '🭫', '🭬', '🭭', '🭮', '🭯', '🭰', '🭱', '🭲', '🭳', '🭴', '🭵', '🭶', '🭷', '🭸', '🭹', '🭺', '🭻', '🭼', '🭽', '🭾', '🭿', '🮀', '🮁', '🮂', '🮃', '🮄', '🮅', '🮆', '🮇', '🮈', '🮉', '🮊', '🮋', '🮌', '🮍', '🮎', '🮏', '🮐', '🮑', '🮒', '🮓', '🮔', '🮕', '🮖', '🮗', '🮘', '🮙', '🮚', '🮛', '🮜', '🮝', '🮞', '🮟', '🮠', '🮡', '🮢', '🮣', '🮤', '🮥', '🮦', '🮧', '🮨', '🮩', '🮪', '🮫', '🮬', '🮭', '🮮', '🮯', '🮰', '🮱', '🮲', '🮳', '🮴', '🮵', '🮶', '🮷', '🮸', '🮹', '🮺', '🮻', '🮼', '🮽', '🮾', '🮿', '🯀', '🯁', '🯂', '🯃', '🯄', '🯅', '🯆', '🯇', '🯈', '🯉', '🯊', '🯋', '🯌', '🯍', '🯎', '🯏', '🯐', '🯑', '🯒', '🯓', '🯔', '🯕', '🯖', '🯗', '🯘', '🯙', '🯚', '🯛', '🯜', '🯝', '🯞', '🯟', '🯠', '🯡', '🯢', '🯣', '🯤', '🯥', '🯦', '🯧', '🯨', '🯩', '🯪', '🯫', '🯬', '🯭', '🯮', '🯯', '🯰', '🯱', '🯲', '🯳', '🯴', '🯵', '🯶', '🯷', '🯸', '🯹', '🯺', '🯻', '🯼', '🯽', '🯾', '🯿', '🰀', '🰁', '🰂', '🰃', '🰄', '🰅', '🰆', '🰇', '🰈', '🰉', '🰊', '🰋', '🰌', '🰍', '🰎', '🰏', '🰐', '🰑', '🰒', '🰓', '🰔', '🰕', '🰖', '🰗', '🰘', '🰙', '🰚', '🰛', '🰜', '🰝', '🰞', '🰟', '🰠', '🰡', '🰢', '🰣', '🰤', '🰥', '🰦', '🰧', '🰨', '🰩', '🰪', '🰫', '🰬', '🰭', '🰮', '🰯', '🰰', '🰱', '🰲', '🰳', '🰴', '🰵', '🰶', '🰷', '🰸', '🰹', '🰺', '🰻', '🰼', '🰽', '🰾', '🰿', '🱀', '🱁', '🱂', '🱃', '🱄', '🱅', '🱆', '🱇', '🱈', '🱉', '🱊', '🱋', '🱌', '🱍', '🱎', '🱏', '🱐', '🱑', '🱒', '🱓', '🱔', '🱕', '🱖', '🱗', '🱘', '🱙', '🱚', '🱛', '🱜', '🱝', '🱞', '🱟', '🱠', '🱡', '🱢', '🱣', '🱤', '🱥', '🱦', '🱧', '🱨', '🱩', '🱪', '🱫', '🱬', '🱭', '🱮', '🱯', '🱰', '🱱', '🱲', '🱳', '🱴', '🱵', '🱶', '🱷', '🱸', '🱹', '🱺', '🱻', '🱼', '🱽', '🱾', '🱿', '🲀', '🲁', '🲂', '🲃', '🲄', '🲅', '🲆', '🲇', '🲈', '🲉', '🲊', '🲋', '🲌', '🲍', '🲎', '🲏', '🲐', '🲑', '🲒', '🲓', '🲔', '🲕', '🲖', '🲗', '🲘', '🲙', '🲚', '🲛', '🲜', '🲝', '🲞', '🲟', '🲠', '🲡', '🲢', '🲣', '🲤', '🲥', '🲦', '🲧', '🲨', '🲩', '🲪', '🲫', '🲬', '🲭', '🲮', '🲯', '🲰', '🲱', '🲲', '🲳', '🲴', '🲵', '🲶', '🲷', '🲸', '🲹', '🲺', '🲻', '🲼', '🲽', '🲾', '🲿', '🳀', '🳁', '🳂', '🳃', '🳄', '🳅', '🳆', '🳇', '🳈', '🳉', '🳊', '🳋', '🳌', '🳍', '🳎', '🳏', '🳐', '🳑', '🳒', '🳓', '🳔', '🳕', '🳖', '🳗', '🳘', '🳙', '🳚', '🳛', '🳜', '🳝', '🳞', '🳟', '🳠', '🳡', '🳢', '🳣', '🳤', '🳥', '🳦', '🳧', '🳨', '🳩', '🳪', '🳫', '🳬', '🳭', '🳮', '🳯', '🳰', '🳱', '🳲', '🳳', '🳴', '🳵', '🳶', '🳷', '🳸', '🳹', '🳺', '🳻', '🳼', '🳽', '🳾', '🳿', '🴀', '🴁', '🴂', '🴃', '🴄', '🴅', '🴆', '🴇', '🴈', '🴉', '🴊', '🴋', '🴌', '🴍', '🴎', '🴏', '🴐', '🴑', '🴒', '🴓', '🴔', '🴕', '🴖', '🴗', '🴘', '🴙', '🴚', '🴛', '🴜', '🴝', '🴞', '🴟', '🴠', '🴡', '🴢', '🴣', '🴤', '🴥', '🴦', '🴧', '🴨', '🴩', '🴪', '🴫', '🴬', '🴭', '🴮', '🴯', '🴰', '🴱', '🴲', '🴳', '🴴', '🴵', '🴶', '🴷', '🴸', '🴹', '🴺', '🴻', '🴼', '🴽', '🴾', '🴿', '🵀', '🵁', '🵂', '🵃', '🵄', '🵅', '🵆', '🵇', '🵈', '🵉', '🵊', '🵋', '🵌', '🵍', '🵎', '🵏', '🵐', '🵑', '🵒', '🵓', '🵔', '🵕', '🵖', '🵗', '🵘', '🵙', '🵚', '🵛', '🵜', '🵝', '🵞', '🵟', '🵠', '🵡', '🵢', '🵣', '🵤', '🵥', '🵦', '🵧', '🵨', '🵩', '🵪', '🵫', '🵬', '🵭', '🵮', '🵯', '🵰', '🵱', '🵲', '🵳', '🵴', '🵵', '🵶', '🵷', '🵸', '🵹', '🵺', '🵻', '🵼', '🵽', '🵾', '🵿', '🶀', '🶁', '🶂', '🶃', '🶄', '🶅', '🶆', '🶇', '🶈', '🶉', '🶊', '🶋', '🶌', '🶍', '🶎', '🶏', '🶐', '🶑', '🶒', '🶓', '🶔', '🶕', '🶖', '🶗', '🶘', '🶙', '🶚', '🶛', '🶜', '🶝', '🶞', '🶟', '🶠', '🶡', '🶢', '🶣', '🶤', '🶥', '🶦', '🶧', '🶨', '🶩', '🶪', '🶫', '🶬', '🶭', '🶮', '🶯', '🶰', '🶱', '🶲', '🶳', '🶴', '🶵', '🶶', '🶷', '🶸', '🶹', '🶺', '🶻', '🶼', '🶽', '🶾', '🶿', '🷀', '🷁', '🷂', '🷃', '🷄', '🷅', '🷆', '🷇', '🷈', '🷉', '🷊', '🷋', '🷌', '🷍', '🷎', '🷏', '🷐', '🷑', '🷒', '🷓', '🷔', '🷕', '🷖', '🷗', '🷘', '🷙', '🷚', '🷛', '🷜', '🷝', '🷞', '🷟', '🷠', '🷡', '🷢', '🷣', '🷤', '🷥', '🷦', '🷧', '🷨', '🷩', '🷪', '🷫', '🷬', '🷭', '🷮', '🷯', '🷰', '🷱', '🷲', '🷳', '🷴', '🷵', '🷶', '🷷', '🷸', '🷹', '🷺', '🷻', '🷼', '🷽', '🷾', '🷿', '🸀', '🸁', '🸂', '🸃', '🸄', '🸅', '🸆', '🸇', '🸈', '🸉', '🸊', '🸋', '🸌', '🸍', '🸎', '🸏', '🸐', '🸑', '🸒', '🸓', '🸔', '🸕', '🸖', '🸗', '🸘', '🸙', '🸚', '🸛', '🸜', '🸝', '🸞', '🸟', '🸠', '🸡', '🸢', '🸣', '🸤', '🸥', '🸦', '🸧', '🸨', '🸩', '🸪', '🸫', '🸬', '🸭', '🸮', '🸯', '🸰', '🸱', '🸲', '🸳', '🸴', '🸵', '🸶', '🸷', '🸸', '🸹', '🸺', '🸻', '🸼', '🸽', '🸾', '🸿', '🹀', '🹁', '🹂', '🹃', '🹄', '🹅', '🹆', '🹇', '🹈', '🹉', '🹊', '🹋', '🹌', '🹍', '🹎', '🹏', '🹐', '🹑', '🹒', '🹓', '🹔', '🹕', '🹖', '🹗', '🹘', '🹙', '🹚', '🹛', '🹜', '🹝', '🹞', '🹟', '🹠', '🹡', '🹢', '🹣', '🹤', '🹥', '🹦', '🹧', '🹨', '🹩', '🹪', '🹫', '🹬', '🹭', '🹮', '🹯', '🹰', '🹱', '🹲', '🹳', '🹴', '🹵', '🹶', '🹷', '🹸', '🹹', '🹺', '🹻', '🹼', '🹽', '🹾', '🹿', '🺀', '🺁', '🺂', '🺃', '🺄', '🺅', '🺆', '🺇', '🺈', '🺉', '🺊', '🺋', '🺌', '🺍', '🺎', '🺏', '🺐', '🺑', '🺒', '🺓', '🺔', '🺕', '🺖', '🺗', '🺘', '🺙', '🺚', '🺛', '🺜', '🺝', '🺞', '🺟', '🺠', '🺡', '🺢', '🺣', '🺤', '🺥', '🺦', '🺧', '🺨', '🺩', '🺪', '🺫', '🺬', '🺭', '🺮', '🺯', '🺰', '🺱', '🺲', '🺳', '🺴', '🺵', '🺶', '🺷', '🺸', '🺹', '🺺', '🺻', '🺼', '🺽', '🺾', '🺿', '🻀', '🻁', '🻂', '🻃', '🻄', '🻅', '🻆', '🻇', '🻈', '🻉', '🻊', '🻋', '🻌', '🻍', '🻎', '🻏', '🻐', '🻑', '🻒', '🻓', '🻔', '🻕', '🻖', '🻗', '🻘', '🻙', '🻚', '🻛', '🻜', '🻝', '🻞', '🻟', '🻠', '🻡', '🻢', '🻣', '🻤', '🻥', '🻦', '🻧', '🻨', '🻩', '🻪', '🻫', '🻬', '🻭', '🻮', '🻯', '🻰', '🻱', '🻲', '🻳', '🻴', '🻵', '🻶', '🻷', '🻸', '🻹', '🻺', '🻻', '🻼', '🻽', '🻾', '🻿', '🼀', '🼁', '🼂', '🼃', '🼄', '🼅', '🼆', '🼇', '🼈', '🼉', '🼊', '🼋', '🼌', '🼍', '🼎', '🼏', '🼐', '🼑', '🼒', '🼓', '🼔', '🼕', '🼖', '🼗', '🼘', '🼙', '🼚', '🼛', '🼜', '🼝', '🼞', '🼟', '🼠', '🼡', '🼢', '🼣', '🼤', '🼥', '🼦', '🼧', '🼨', '🼩', '🼪', '🼫', '🼬', '🼭', '🼮', '🼯', '🼰', '🼱', '🼲', '🼳', '🼴', '🼵', '🼶', '🼷', '🼸', '🼹', '🼺', '🼻', '🼼', '🼽', '🼾', '🼿', '🽀', '🽁', '🽂', '🽃', '🽄', '🽅', '🽆', '🽇', '🽈', '🽉', '🽊', '🽋', '🽌', '🽍', '🽎', '🽏', '🽐', '🽑', '🽒', '🽓', '🽔', '🽕', '🽖', '🽗', '🽘', '🽙', '🽚', '🽛', '🽜', '🽝', '🽞', '🽟', '🽠', '🽡', '🽢', '🽣', '🽤', '🽥', '🽦', '🽧', '🽨', '🽩', '🽪', '🽫', '🽬', '🽭', '🽮', '🽯', '🽰', '🽱', '🽲', '🽳', '🽴', '🽵', '🽶', '🽷', '🽸', '🽹', '🽺', '🽻', '🽼', '🽽', '🽾', '🽿', '🾀', '🾁', '🾂', '🾃', '🾄', '🾅', '🾆', '🾇', '🾈', '🾉', '🾊', '🾋', '🾌', '🾍', '🾎', '🾏', '🾐', '🾑', '🾒', '🾓', '🾔', '🾕', '🾖', '🾗', '🾘', '🾙', '🾚', '🾛', '🾜', '🾝', '🾞', '🾟', '🾠', '🾡', '🾢', '🾣', '🾤', '🾥', '🾦', '🾧', '🾨', '🾩', '🾪', '🾫', '🾬', '🾭', '🾮', '🾯', '🾰', '🾱', '🾲', '🾳', '🾴', '🾵', '🾶', '🾷', '🾸', '🾹', '🾺', '🾻', '🾼', '🾽', '🾾', '🾿', '🿀', '🿁', '🿂', '🿃', '🿄', '🿅', '🿆', '🿇', '🿈', '🿉', '🿊', '🿋', '🿌', '🿍', '🿎', '🿏', '🿐', '🿑', '🿒', '🿓', '🿔', '🿕', '🿖', '🿗', '🿘', '🿙', '🿚', '🿛', '🿜', '🿝', '🿞', '🿟', '🿠', '🿡', '🿢', '🿣', '🿤', '🿥', '🿦', '🿧', '🿨', '🿩', '🿪', '🿫', '🿬', '🿭', '🿮', '🿯', '🿰', '🿱', '🿲', '🿳', '🿴', '🿵', '🿶', '🿷', '🿸', '🿹', '🿺', '🿻', '🿼', '🿽', '🿾', '🿿'],
    symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 w-80">
      {/* Category tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {Object.keys(emojiCategories).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex-1 px-3 py-2 text-sm transition-colors ${
              selectedCategory === category 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-base">
              {category === 'recent' && '🕒'}
              {category === 'people' && '😀'}
              {category === 'gestures' && '👍'}
              {category === 'objects' && '📱'}
              {category === 'symbols' && '❤️'}
            </span>
          </button>
        ))}
      </div>
      
      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto p-3">
        {emojiCategories[selectedCategory as keyof typeof emojiCategories].map((emoji, index) => (
          <button
            key={index}
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg transition-colors flex items-center justify-center min-h-[32px]"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

// Comprehensive Text formatting menu component matching the provided UI design
  const ColorPicker = ({ 
    isOpen, 
    colorType, 
    onColorSelect, 
    onClose,
    selectedHighlightColor,
    selectedFontColor
  }: { 
    isOpen: boolean; 
    colorType: 'highlight' | 'fontColor'; 
    onColorSelect: (colorType: 'highlight' | 'fontColor', color: string) => void; 
    onClose: () => void;
    selectedHighlightColor: string;
    selectedFontColor: string;
  }) => {
    const colors = [
      '#ef4444', // Red
      '#f97316', // Orange
      '#eab308', // Yellow
      '#22c55e', // Green
      '#06b6d4', // Cyan
      '#3b82f6', // Blue
      '#8b5cf6', // Violet
      '#ec4899', // Pink
      '#6b7280', // Gray
      '#000000', // Black
      '#ffffff', // White
      '#fef08a', // Light Yellow (highlight)
      '#fecaca', // Light Red
      '#bbf7d0', // Light Green
      '#bfdbfe', // Light Blue
      '#e9d5ff', // Light Purple
    ];

    if (!isOpen) return null;

    return (
      <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[60] p-3 min-w-[280px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {colorType === 'highlight' ? 'Text Highlight Color' : 'Font Color'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-8 gap-2 mb-3">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onColorSelect(colorType, color)}
              className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:scale-110 transition-all duration-200 shadow-sm"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Custom Color:</span>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={colorType === 'highlight' ? selectedHighlightColor : selectedFontColor}
                onChange={(e) => onColorSelect(colorType, e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:scale-110 transition-transform duration-200"
              />
              <span className="text-xs text-gray-400 font-mono">
                {colorType === 'highlight' ? selectedHighlightColor : selectedFontColor}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TextFormattingMenu = ({ 
    isOpen, 
    onTextFormat, 
    selectedHighlightColor,
    selectedFontColor,
    setShowColorPicker
  }: { 
    isOpen: boolean; 
    onTextFormat: (format: string, event?: React.MouseEvent) => void; 
    selectedHighlightColor: string;
    selectedFontColor: string;
    setShowColorPicker: (type: 'highlight' | 'fontColor' | null) => void;
  }) => {
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  const handleFormatClick = (format: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Apply formatting
    onTextFormat(format, event);
    
    // Update active state based on the formatting applied
    setTimeout(() => {
      const editor = document.querySelector('[contenteditable="true"]');
      if (editor) {
        // Check if the current selection has the formatting
        let isActive = false;
        const selection = window.getSelection();
        
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const parentElement = range.commonAncestorContainer.parentElement;
          
          switch (format) {
            case 'bold':
              isActive = !!(parentElement && parentElement.tagName === 'STRONG');
              break;
            case 'italic':
              isActive = !!(parentElement && parentElement.tagName === 'EM');
              break;
            case 'underline':
              isActive = !!(parentElement && parentElement.tagName === 'U');
              break;
            case 'strikethrough':
              isActive = !!(parentElement && parentElement.tagName === 'S');
              break;
            case 'code':
              isActive = !!(parentElement && parentElement.tagName === 'CODE');
              break;
            case 'highlight':
              isActive = !!(parentElement && parentElement.tagName === 'MARK');
              break;
            case 'fontColor':
              isActive = !!(parentElement && parentElement.tagName === 'SPAN' && parentElement.style.color);
              break;
            case 'fontSize':
              isActive = !!(parentElement && parentElement.tagName === 'SPAN' && parentElement.style.fontSize);
              break;
            case 'link':
              isActive = !!(parentElement && parentElement.tagName === 'A');
              break;
            case 'quote':
              isActive = !!(parentElement && parentElement.tagName === 'BLOCKQUOTE');
              break;
          }
        }
        
        setActiveFormats(prev => 
          isActive 
            ? [...prev.filter(f => f !== format), format]
            : prev.filter(f => f !== format)
        );
      }
    }, 100);
  };

  const handleAdvancedFormatClick = (format: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (format === 'highlight' || format === 'fontColor') {
      setShowColorPicker(format as 'highlight' | 'fontColor');
    } else {
      onTextFormat(format, event);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 w-80">
      {/* Top Row - Basic Formatting */}
      <div className="flex p-2 border-b border-gray-200 dark:border-gray-700">
        {/* Bold */}
        <button 
          type="button"
          onClick={(e) => handleFormatClick('bold', e)}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 transition-colors ${
            activeFormats.includes('bold') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Bold (Ctrl+B)"
        >
          <span className="font-bold text-sm">B</span>
        </button>
        
        {/* Italic */}
        <button 
          type="button"
          onClick={(e) => handleFormatClick('italic', e)}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 transition-colors ${
            activeFormats.includes('italic') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Italic (Ctrl+I)"
        >
          <span className="italic text-sm">//</span>
        </button>
        
        {/* Underline */}
        <button 
          type="button"
          onClick={(e) => handleFormatClick('underline', e)}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 transition-colors ${
            activeFormats.includes('underline') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Underline (Ctrl+U)"
        >
          <span className="underline text-sm">U</span>
        </button>
        
        {/* Strikethrough */}
        <button 
          type="button"
          onClick={(e) => handleFormatClick('strikethrough', e)}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 transition-colors ${
            activeFormats.includes('strikethrough') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Strikethrough"
        >
          <span className="line-through text-sm">H</span>
        </button>
        
        {/* Separator */}
        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
        
        {/* List Options */}
        <button 
          type="button"
          onClick={(e) => handleFormatClick('bullet', e)}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 transition-colors ${
            activeFormats.includes('bullet') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button 
          type="button"
          onClick={(e) => handleFormatClick('numbered', e)}
          className={`p-2 rounded text-gray-700 dark:text-gray-300 transition-colors ${
            activeFormats.includes('numbered') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Advanced Formatting Options */}
      <div className="p-2">
        {/* Text highlight colour */}
        <button 
          type="button"
          onClick={(e) => handleAdvancedFormatClick('highlight', e)}
          className="w-full flex items-center space-x-3 p-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <div 
            className="w-5 h-5 rounded-sm border border-gray-300"
            style={{ backgroundColor: selectedHighlightColor }}
          ></div>
          <span className="text-sm">Text highlight colour</span>
        </button>
        
        <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
        
        {/* Font colour */}
        <button 
          type="button"
          onClick={(e) => handleAdvancedFormatClick('fontColor', e)}
          className="w-full flex items-center space-x-3 p-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <div 
            className="w-5 h-5 rounded-sm border border-gray-300"
            style={{ backgroundColor: selectedFontColor }}
          ></div>
          <span className="text-sm">Font colour</span>
        </button>
        
        <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
        
        {/* Font size */}
        <button 
          type="button"
          onClick={(e) => handleAdvancedFormatClick('fontSize', e)}
          className="w-full flex items-center space-x-3 p-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Font size</span>
        </button>
        
        <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
        
        {/* Quote */}
        <button 
          type="button"
          onClick={(e) => handleAdvancedFormatClick('quote', e)}
          className="w-full flex items-center space-x-3 p-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Quote</span>
        </button>
        
        <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
        
        {/* Insert link */}
        <button 
          type="button"
          onClick={(e) => handleAdvancedFormatClick('link', e)}
          className="w-full flex items-center space-x-3 p-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Insert link</span>
        </button>
        
        <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
        
        {/* Code block */}
        <button 
          type="button"
          onClick={(e) => handleAdvancedFormatClick('codeBlock', e)}
          className="w-full flex items-center space-x-3 p-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Code block</span>
        </button>
        
        <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
        
        {/* Paragraph */}
        <button 
          type="button"
          onClick={(e) => handleAdvancedFormatClick('paragraph', e)}
          className="w-full flex items-center space-x-3 p-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Paragraph</span>
        </button>
        
        <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
        
        {/* Code */}
        <button 
          type="button"
          onClick={(e) => handleAdvancedFormatClick('code', e)}
          className="w-full flex items-center space-x-3 p-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Code</span>
        </button>
        
        <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
        
        {/* Clear all formatting */}
        <button 
          type="button"
          onClick={(e) => handleAdvancedFormatClick('clearFormatting', e)}
          className="w-full flex items-center space-x-3 p-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Clear all formatting</span>
        </button>
      </div>
    </div>
  );
};

// Message scheduler component
const MessageScheduler = ({ isOpen, onClose, onSchedule }: { isOpen: boolean; onClose: () => void; onSchedule: (date: Date) => void }) => {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const handleSchedule = () => {
    if (scheduledDate && scheduledTime) {
      const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      onSchedule(dateTime);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-xl z-50 w-64">
      <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-3">Schedule Message</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-gray-600 dark:text-gray-300 text-xs mb-1">Date</label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <label className="block text-gray-600 dark:text-gray-300 text-xs mb-1">Time</label>
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSchedule}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Schedule
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MessageInput({ 
  onSendMessage, 
  onScheduleMessage,
  onTyping,
  placeholder = "Type your message...", 
  disabled = false,
  className = ""
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFormattingMenu, setShowFormattingMenu] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showColorPicker, setShowColorPicker] = useState<'highlight' | 'fontColor' | null>(null);
  const [selectedHighlightColor, setSelectedHighlightColor] = useState('#fef08a');
  const [selectedFontColor, setSelectedFontColor] = useState('#ef4444');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-resize textarea when message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const textContent = editorRef.current?.textContent?.trim() || '';
    if (textContent || attachedFiles.length > 0) {
      onSendMessage(message, attachedFiles.length > 0 ? attachedFiles : undefined);
      
      // Clear the contentEditable div
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      
      // Clear state
      setMessage('');
      setAttachedFiles([]);
      
      // Stop typing indicator
      if (onTyping) {
        onTyping(false);
      }
    }
  };


  const handleEditorChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      const textContent = editorRef.current.textContent || '';
      setMessage(content);
      if (onTyping) {
        onTyping(textContent.trim().length > 0);
      }
    }
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    editor.focus();
    
    // Get current selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // If no selection, create a range at the end of the editor
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    
    if (!selection) return;
    const range = selection.getRangeAt(0);
    
    // Insert the emoji
    const textNode = document.createTextNode(emoji);
    range.deleteContents();
    range.insertNode(textNode);
    
    // Move cursor after the emoji
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Update the message state with the HTML content
    setMessage(editor.innerHTML);
    
    // Keep focus on the editor
    editor.focus();
  };

  // Handle keyboard shortcuts for formatting
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleTextFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          handleTextFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          handleTextFormat('underline');
          break;
        case 'Enter':
          if (!e.shiftKey) {
      e.preventDefault();
            handleSubmit(e as any);
          }
          break;
      }
    }
  };

  const handleColorSelection = (colorType: 'highlight' | 'fontColor', color: string) => {
    if (colorType === 'highlight') {
      setSelectedHighlightColor(color);
    } else {
      setSelectedFontColor(color);
    }
    setShowColorPicker(null);
    
    // Apply the color formatting immediately
    handleTextFormat(colorType);
  };

  const handleTextFormat = (format: string, event?: React.MouseEvent) => {
    // Prevent form submission
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!editorRef.current) return;

    const editor = editorRef.current;
    
    // Ensure the editor has focus
    editor.focus();
    
    // Get current selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // If no selection, create a range at the end of the editor
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
      }
    }
    
    if (!selection) return;
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    // Apply formatting based on the format type
    switch (format) {
      case 'bold':
        if (selectedText) {
          // Check if already bold
          const parentElement = range.commonAncestorContainer.parentElement;
          if (parentElement && parentElement.tagName === 'STRONG') {
            // Remove bold formatting
            const textNode = document.createTextNode(selectedText);
            range.deleteContents();
            range.insertNode(textNode);
          } else {
            // Apply bold formatting
            const strongElement = document.createElement('strong');
            strongElement.textContent = selectedText;
            range.deleteContents();
            range.insertNode(strongElement);
          }
        } else {
          // Insert bold tags for typing
          const strongElement = document.createElement('strong');
          strongElement.innerHTML = '&nbsp;';
          range.insertNode(strongElement);
          range.setStart(strongElement, 0);
          range.setEnd(strongElement, 0);
        }
        break;
        
      case 'italic':
        if (selectedText) {
          const parentElement = range.commonAncestorContainer.parentElement;
          if (parentElement && parentElement.tagName === 'EM') {
            const textNode = document.createTextNode(selectedText);
            range.deleteContents();
            range.insertNode(textNode);
          } else {
            const emElement = document.createElement('em');
            emElement.textContent = selectedText;
            range.deleteContents();
            range.insertNode(emElement);
          }
        } else {
          const emElement = document.createElement('em');
          emElement.innerHTML = '&nbsp;';
          range.insertNode(emElement);
          range.setStart(emElement, 0);
          range.setEnd(emElement, 0);
        }
        break;
        
      case 'underline':
        if (selectedText) {
          const parentElement = range.commonAncestorContainer.parentElement;
          if (parentElement && parentElement.tagName === 'U') {
            const textNode = document.createTextNode(selectedText);
            range.deleteContents();
            range.insertNode(textNode);
          } else {
            const uElement = document.createElement('u');
            uElement.textContent = selectedText;
            range.deleteContents();
            range.insertNode(uElement);
          }
        } else {
          const uElement = document.createElement('u');
          uElement.innerHTML = '&nbsp;';
          range.insertNode(uElement);
          range.setStart(uElement, 0);
          range.setEnd(uElement, 0);
        }
        break;
        
      case 'strikethrough':
        if (selectedText) {
          const parentElement = range.commonAncestorContainer.parentElement;
          if (parentElement && parentElement.tagName === 'S') {
            const textNode = document.createTextNode(selectedText);
            range.deleteContents();
            range.insertNode(textNode);
          } else {
            const sElement = document.createElement('s');
            sElement.textContent = selectedText;
            range.deleteContents();
            range.insertNode(sElement);
          }
        } else {
          const sElement = document.createElement('s');
          sElement.innerHTML = '&nbsp;';
          range.insertNode(sElement);
          range.setStart(sElement, 0);
          range.setEnd(sElement, 0);
        }
        break;
        
      case 'code':
        if (selectedText) {
          const parentElement = range.commonAncestorContainer.parentElement;
          if (parentElement && parentElement.tagName === 'CODE') {
            const textNode = document.createTextNode(selectedText);
            range.deleteContents();
            range.insertNode(textNode);
          } else {
            const codeElement = document.createElement('code');
            codeElement.style.backgroundColor = '#f3f4f6';
            codeElement.style.padding = '2px 4px';
            codeElement.style.borderRadius = '4px';
            codeElement.style.fontFamily = 'monospace';
            codeElement.style.fontSize = '0.875rem';
            codeElement.textContent = selectedText;
            range.deleteContents();
            range.insertNode(codeElement);
          }
        } else {
          const codeElement = document.createElement('code');
          codeElement.style.backgroundColor = '#f3f4f6';
          codeElement.style.padding = '2px 4px';
          codeElement.style.borderRadius = '4px';
          codeElement.style.fontFamily = 'monospace';
          codeElement.style.fontSize = '0.875rem';
          codeElement.innerHTML = '&nbsp;';
          range.insertNode(codeElement);
          range.setStart(codeElement, 0);
          range.setEnd(codeElement, 0);
        }
        break;
        
      case 'highlight':
        if (selectedText) {
          const markElement = document.createElement('mark');
          markElement.style.backgroundColor = selectedHighlightColor;
          markElement.textContent = selectedText;
          range.deleteContents();
          range.insertNode(markElement);
        } else {
          const markElement = document.createElement('mark');
          markElement.style.backgroundColor = selectedHighlightColor;
          markElement.innerHTML = '&nbsp;';
          range.insertNode(markElement);
          range.setStart(markElement, 0);
          range.setEnd(markElement, 0);
        }
        break;
        
      case 'fontColor':
        if (selectedText) {
          const spanElement = document.createElement('span');
          spanElement.style.color = selectedFontColor;
          spanElement.textContent = selectedText;
          range.deleteContents();
          range.insertNode(spanElement);
        } else {
          const spanElement = document.createElement('span');
          spanElement.style.color = selectedFontColor;
          spanElement.innerHTML = '&nbsp;';
          range.insertNode(spanElement);
          range.setStart(spanElement, 0);
          range.setEnd(spanElement, 0);
        }
        break;
        
      case 'fontSize':
        if (selectedText) {
          const spanElement = document.createElement('span');
          spanElement.style.fontSize = '18px';
          spanElement.textContent = selectedText;
          range.deleteContents();
          range.insertNode(spanElement);
        } else {
          const spanElement = document.createElement('span');
          spanElement.style.fontSize = '18px';
          spanElement.innerHTML = '&nbsp;';
          range.insertNode(spanElement);
          range.setStart(spanElement, 0);
          range.setEnd(spanElement, 0);
        }
        break;
        
      case 'link':
        const url = prompt('Enter URL:');
        if (url && selectedText) {
          const aElement = document.createElement('a');
          aElement.href = url;
          aElement.textContent = selectedText;
          aElement.target = '_blank';
          aElement.rel = 'noopener noreferrer';
          range.deleteContents();
          range.insertNode(aElement);
        }
        break;
        
      case 'quote':
        if (selectedText) {
          const blockquoteElement = document.createElement('blockquote');
          blockquoteElement.style.borderLeft = '4px solid #3b82f6';
          blockquoteElement.style.paddingLeft = '12px';
          blockquoteElement.style.fontStyle = 'italic';
          blockquoteElement.style.color = '#6b7280';
          blockquoteElement.textContent = selectedText;
          range.deleteContents();
          range.insertNode(blockquoteElement);
        } else {
          const blockquoteElement = document.createElement('blockquote');
          blockquoteElement.style.borderLeft = '4px solid #3b82f6';
          blockquoteElement.style.paddingLeft = '12px';
          blockquoteElement.style.fontStyle = 'italic';
          blockquoteElement.style.color = '#6b7280';
          blockquoteElement.innerHTML = '&nbsp;';
          range.insertNode(blockquoteElement);
          range.setStart(blockquoteElement, 0);
          range.setEnd(blockquoteElement, 0);
        }
        break;
        
      case 'clearFormatting':
        if (selectedText) {
          const textNode = document.createTextNode(selectedText);
          range.deleteContents();
          range.insertNode(textNode);
        } else {
          // Clear all formatting from the entire editor
          const textContent = editor.textContent || '';
          editor.innerHTML = '';
          const textNode = document.createTextNode(textContent);
          editor.appendChild(textNode);
        }
        break;
    }
    
    // Update selection
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Update the message state with the HTML content
    setMessage(editor.innerHTML);
    
    // Keep focus on the editor
    editor.focus();
  };

  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' });
        setAttachedFiles(prev => [...prev, audioFile]);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting voice recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };


  const handleSchedule = (date: Date) => {
    onScheduleMessage(message, attachedFiles.length > 0 ? attachedFiles : undefined, date);
    
    // Clear the contentEditable div
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    
    // Clear state
    setMessage('');
    setAttachedFiles([]);
    
    // Stop typing indicator
    if (onTyping) {
      onTyping(false);
    }
  };

  return (
    <div className={`relative bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {/* Attached files display */}
      {attachedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div key={index} className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-white">
              <span className="mr-2">{file.name}</span>
              <button
                onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        {/* Message input - Large, prominent rounded rectangle field on the left */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorChange}
            onKeyDown={handleKeyDown}
            data-placeholder={placeholder}
          className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none overflow-hidden min-h-[48px] max-h-[120px] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 dark:empty:before:text-gray-500 empty:before:pointer-events-none"
            style={{ 
              minHeight: '48px', 
              maxHeight: '120px',
            overflowY: 'auto'
            }}
            suppressContentEditableWarning={true}
        />

            {/* Text formatting menu - Three horizontal lines */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFormattingMenu(!showFormattingMenu);
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Text formatting"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            <TextFormattingMenu 
              isOpen={showFormattingMenu} 
              onTextFormat={handleTextFormat}
              selectedHighlightColor={selectedHighlightColor}
              selectedFontColor={selectedFontColor}
              setShowColorPicker={setShowColorPicker}
          />
          
          <ColorPicker
            isOpen={showColorPicker !== null}
            colorType={showColorPicker || 'highlight'}
            onColorSelect={handleColorSelection}
            onClose={() => setShowColorPicker(null)}
            selectedHighlightColor={selectedHighlightColor}
            selectedFontColor={selectedFontColor}
          />
        </div>

            {/* Emoji picker - Smiling emoji */}
            <div className="relative">
          <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Emoji"
              >
                <span className="text-lg">😊</span>
          </button>
              <EmojiPicker
                isOpen={showEmojiPicker}
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>

            {/* File attachment - Paperclip */}
          <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFileAttachment();
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Attach file"
          >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
          </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Voice recording - Microphone */}
          <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isRecording ? stopVoiceRecording() : startVoiceRecording();
              }}
              className={`p-2 rounded transition-colors ${isRecording ? 'text-red-400 bg-red-900/20' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              title={isRecording ? 'Stop recording' : 'Voice message'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
          </button>


        {/* Send and Scheduler UI - Combined dark gray rounded container */}
        <div className="flex bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          {/* Send button - Paper airplane icon */}
          <button
            type="submit"
            disabled={disabled || (!editorRef.current?.textContent?.trim() && attachedFiles.length === 0)}
            className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>

          {/* Vertical separator - Light blue line */}
          <div className="w-px bg-blue-400"></div>

          {/* Scheduler button - Up arrow icon */}
          <div className="relative">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowScheduler(!showScheduler);
              }}
              className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              title="Schedule message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>

        <MessageScheduler
          isOpen={showScheduler}
          onClose={() => setShowScheduler(false)}
          onSchedule={handleSchedule}
        />
      </form>
    </div>
  );
}
