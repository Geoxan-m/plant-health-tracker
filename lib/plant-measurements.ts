export const profiles = {
 'Monstera deliciosa': {art:'monstera',accent:'#174c3b',height:168,spread:112,leaf:58,moisture:43,light:1800,temperature:23,humidity:64,ph:6.2,note:'Large, deeply split leaves; one new leaf this week.'},
 'Epipremnum aureum': {art:'pothos',accent:'#51751e',height:145,spread:78,leaf:16,moisture:37,light:1100,temperature:22,humidity:59,ph:6.3,note:'Full trailing growth with golden variegation; three new leaves.'},
 'Strelitzia reginae': {art:'strelitzia',accent:'#a65b1d',height:124,spread:86,leaf:46,moisture:31,light:5800,temperature:24,humidity:53,ph:6.5,note:'One orange-and-blue flower open; monitor the dry edge on an older leaf.'},
 'Camellia japonica': {art:'camellia',accent:'#a92a45',height:92,spread:70,leaf:9,moisture:26,light:3200,temperature:18,humidity:68,ph:5.6,note:'Seven crimson flowers and twelve buds; some bud drop after a dry spell.'},
} as const;
export function plantProfile(species:string){return profiles[species as keyof typeof profiles];}
export function measurementHistory(species:string){const p=plantProfile(species);if(!p)return [];return Array.from({length:7},(_,i)=>({day:`Day ${i+1}`,moisture:p.moisture+[7,3,-2,12,8,4,0][i],temperature:p.temperature+[0,-1,1,0,2,1,0][i]}));}
