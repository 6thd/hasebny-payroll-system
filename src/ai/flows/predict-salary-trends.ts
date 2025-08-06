'use server';

/**
 * @fileOverview Predicts trends in employee financial data using time-series data and LLM analysis.
 *
 * - predictSalaryTrends - A function that predicts salary trends for an employee.
 * - PredictSalaryTrendsInput - The input type for the predictSalaryTrends function.
 * - PredictSalaryTrendsOutput - The return type for the predictSalaryTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictSalaryTrendsInputSchema = z.object({
  employeeId: z.string().describe('The ID of the employee to predict salary trends for.'),
  timeSeriesData: z.string().describe('Time-series data of financial amounts related to the employee.')
});
export type PredictSalaryTrendsInput = z.infer<typeof PredictSalaryTrendsInputSchema>;

const PredictSalaryTrendsOutputSchema = z.object({
  trendAnalysis: z.string().describe('The analysis of the trend of financial amounts related to each employee.'),
});
export type PredictSalaryTrendsOutput = z.infer<typeof PredictSalaryTrendsOutputSchema>;

export async function predictSalaryTrends(input: PredictSalaryTrendsInput): Promise<PredictSalaryTrendsOutput> {
  return predictSalaryTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictSalaryTrendsPrompt',
  input: {schema: PredictSalaryTrendsInputSchema},
  output: {schema: PredictSalaryTrendsOutputSchema},
  prompt: `You are an expert in financial analysis and human resources. Analyze the provided time-series data to predict trends in financial amounts related to the specified employee. Provide a clear and concise trend analysis that can inform financial planning.

Employee ID: {{{employeeId}}}
Time-Series Data: {{{timeSeriesData}}}`,
});

const predictSalaryTrendsFlow = ai.defineFlow(
  {
    name: 'predictSalaryTrendsFlow',
    inputSchema: PredictSalaryTrendsInputSchema,
    outputSchema: PredictSalaryTrendsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
