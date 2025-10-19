import * as tf from '@tensorflow/tfjs';
// import { getPayrollHistory } from './firestoreUtils';

// NOTE: getPayrollHistory is not defined yet. 
// This is a placeholder until we have a way to fetch payroll history.
async function getPayrollHistory(employeeId: string): Promise<{salary: number}[]> {
    console.log(`Fetching payroll history for ${employeeId}...`);
    // This is mock data. In a real application, you would fetch this from Firestore.
    return [
        { salary: 5000 }, { salary: 5100 }, { salary: 5050 },
        { salary: 5200 }, { salary: 5250 }, { salary: 5300 },
    ];
}


export async function predictSalaryTrend(employeeId: string) {
  const history = await getPayrollHistory(employeeId);
  if (history.length < 6) throw Error('يلزم 6 أشهر من البيانات على الأقل');

  // تحويل البيانات إلى تسلسل زمني مناسب للنموذج
  const salaries = history.map(h => h.salary);
  const xs = tf.tensor2d(salaries.slice(0, -1), [salaries.length - 1, 1]);
  const ys = tf.tensor2d(salaries.slice(1), [salaries.length - 1, 1]);

  const model = tf.sequential();
  model.add(tf.layers.dense({units: 8, inputShape: [1], activation: 'relu'}));
  model.add(tf.layers.dense({units: 1}));
  model.compile({loss: 'meanSquaredError', optimizer: 'adam'});

  await model.fit(xs, ys, {epochs: 180});
  const nextSalary = model.predict(tf.tensor2d([salaries[salaries.length-1]], [1,1])).dataSync()[0];
  return nextSalary;
}
