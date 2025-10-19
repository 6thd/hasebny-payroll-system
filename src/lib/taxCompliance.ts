import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function calcGOSI(salary: number) {
  return {
    employee: +(salary * 0.09).toFixed(2),
    employer: +(salary * 0.12).toFixed(2)
  };
}

export async function getNitaqatStatus() {
  const statsRef = doc(db, 'compliance', 'nitaqat');
  const stats = await getDoc(statsRef);
  return stats.exists() ? stats.data() : null;
}

export function calcEOSB(salary: number, years: number) {
  if (years < 5) return salary/2 * years;
  return ((salary/2 * 5) + (salary * (years-5)));
}
