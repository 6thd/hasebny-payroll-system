import * as tf from '@tensorflow/tfjs';

async function getPayrollHistory(employeeId: string): Promise<{salary: number}[]> {
    console.log(`Fetching payroll history for ${employeeId}...`);
    // This is mock data. In a real application, you would fetch this from Firestore.
    return [
        { salary: 5000 }, { salary: 5100 }, { salary: 5050 },
        { salary: 5200 }, { salary: 5250 }, { salary: 5300 },
    ];
}

export async function predictSalaryTrend(employeeId: string): Promise<number> {
  const history = await getPayrollHistory(employeeId);
  if (history.length < 6) throw new Error('A minimum of 6 months of data is required.');

  const salaries = history.map(h => h.salary);

  // Prepare the data for the model
  const xs = tf.tensor2d(salaries.slice(0, -1), [salaries.length - 1, 1]);
  const ys = tf.tensor2d(salaries.slice(1), [salaries.length - 1, 1]);

  // Define and compile the model
  const model = tf.sequential();
  model.add(tf.layers.dense({units: 8, inputShape: [1], activation: 'relu'}));
  model.add(tf.layers.dense({units: 1}));
  model.compile({loss: 'meanSquaredError', optimizer: 'adam'});

  // Train the model
  await model.fit(xs, ys, {epochs: 180, verbose: 0});

  // Use tf.tidy for prediction and automatic memory cleanup
  const nextSalary = tf.tidy(() => {
    const input = tf.tensor2d([salaries[salaries.length - 1]], [1, 1]);
    const prediction = model.predict(input);

    // Use `instanceof` and `Array.isArray` as robust type guards
    if (prediction instanceof tf.Tensor) {
        return prediction.dataSync()[0];
    } else if (Array.isArray(prediction)) {
        return prediction[0].dataSync()[0];
    } else {
        throw new Error("Unexpected output format from model.predict");
    }
  });

  // Manually dispose of the tensors used for training
  xs.dispose();
  ys.dispose();
  model.dispose();

  return nextSalary;
}
