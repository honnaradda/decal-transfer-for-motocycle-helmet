
import { DecalPrompt, HelmetType } from './types';

export const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = result.split(',')[0].split(':')[1].split(';')[0];
      const data = result.split(',')[1];
      resolve({ mimeType, data });
    };
    reader.onerror = (error) => reject(error);
  });
};

export const decalPromptToText = (prompt: DecalPrompt, lang: 'vi' | 'en', preserveFinish: boolean, avoidZones: boolean): string => {
  const constraints = [];
  if (preserveFinish) constraints.push(lang === 'vi' ? 'Giữ nguyên hình dáng và vật liệu của nón bảo hiểm' : 'Keep helmet shape/material');
  if (avoidZones) constraints.push(lang === 'vi' ? 'tránh các vùng kính và khe thông gió' : 'avoid visor & vents');
  if (preserveFinish) constraints.push(lang === 'vi' ? 'bảo toàn hiệu ứng phản chiếu ánh sáng' : 'preserve reflections');
  
  const constraintText = constraints.length > 0 ? constraints.join(', ') + '.' : (lang === 'vi' ? 'Không có' : 'None');

  if (lang === 'vi') {
    return `[Chủ đề decal]: ${prompt.theme}
[Mô-típ]: ${prompt.motifs}
[Dòng chảy họa tiết]: ${prompt.flow}
[Bảng màu HEX]: ${prompt.palette}
[Mật độ]: ${prompt.density}
[Hiệu ứng bề mặt]: ${prompt.finish}
[Chữ]: ${prompt.typography}
[Tính cách]: ${prompt.mood}
[Ràng buộc]: ${constraintText}`;
  }
  return `[Decal Theme]: ${prompt.theme}
[Motifs]: ${prompt.motifs}
[Pattern Flow]: ${prompt.flow}
[Palette HEX]: ${prompt.palette}
[Density]: ${prompt.density}
[Finish Cues]: ${prompt.finish}
[Typography]: ${prompt.typography}
[Mood/Style Adjectives]: ${prompt.mood}
[Constraints]: ${constraintText}`;
};

export const parsePromptText = (text: string): DecalPrompt => {
    const prompt: any = { theme: '', motifs: '', flow: '', palette: '', density: '', finish: '', typography: '', mood: '' };
    const lines = text.split('\n');
    lines.forEach(line => {
        const match = line.match(/\[(.*?)\]:\s*(.*)/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            switch(key) {
                case 'Decal Theme': case 'Chủ đề decal': prompt.theme = value; break;
                case 'Motifs': case 'Mô-típ': prompt.motifs = value; break;
                case 'Pattern Flow': case 'Dòng chảy họa tiết': prompt.flow = value; break;
                case 'Palette HEX': case 'Bảng màu HEX': prompt.palette = value; break;
                case 'Density': case 'Mật độ': prompt.density = value; break;
                case 'Finish Cues': case 'Hiệu ứng bề mặt': prompt.finish = value; break;
                case 'Typography': case 'Chữ': prompt.typography = value; break;
                case 'Mood/Style Adjectives': case 'Tính cách': prompt.mood = value; break;
            }
        }
    });
    return prompt as DecalPrompt;
};

export const getHelmetProfileInstructions = (type: HelmetType | null, lang: 'vi' | 'en'): string => {
    if (!type) return '';
    const instructions = {
        'half-face': {
            en: "INSTRUCTION: This is a half-face helmet. The decal must not cover the open face area. Keep the design on the helmet shell.",
            vi: "HƯỚNG DẪN: Đây là nón bảo hiểm nửa đầu. Decal không được che phủ vùng mặt hở. Giữ thiết kế trên vỏ nón."
        },
        'open-face': {
            en: "INSTRUCTION: This is an open-face (3/4) helmet. Avoid applying the decal over the face opening, visor hinge, and any snaps.",
            vi: "HƯỚNG DẪN: Đây là nón bảo hiểm 3/4. Tránh áp decal lên vùng mặt hở, khớp kính và các nút bấm."
        },
        'fullface': {
            en: "INSTRUCTION: This is a full-face helmet. The decal must not cover the visor, visor hinge, vents, or the chin bar's lower edge.",
            vi: "HƯỚNG DẪN: Đây là nón bảo hiểm full-face. Decal không được che phủ kính, khớp kính, khe thông gió, hoặc cạnh dưới của cằm."
        },
        'cross-mx': {
            en: "INSTRUCTION: This is a motocross/MX helmet. The decal must not cover the goggle port, peak/visor, or the prominent chin bar vents.",
            vi: "HƯỚg DẪN: Đây là nón bảo hiểm cào cào/MX. Decal không được che phủ cổng kính, lưỡi trai/mái che, hoặc các khe thông gió lớn ở cằm."
        }
    };
    return `\n\n${instructions[type][lang]}`;
};
