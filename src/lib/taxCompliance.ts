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
  if (years < 2) return 0; // No gratuity for less than 2 years of service
  
  let gratuity = 0;
  if (years <= 5) {
    // Half month's salary for each of the first five years
    gratuity = (salary / 2) * years;
  } else {
    // Half month's salary for the first 5 years + one month's salary for subsequent years
    gratuity = (salary / 2) * 5 + salary * (years - 5);
  }
  return gratuity;
}
