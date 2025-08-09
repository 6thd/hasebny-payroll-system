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
  employeeName: z.string().describe('The name of the employee.'),
  timeSeriesData: z.string().describe('A JSON string representing an array of the last 6 months of payroll data for the employee.')
});
export type PredictSalaryTrendsInput = z.infer<typeof PredictSalaryTrendsInputSchema>;

const TrendAnalysisSchema = z.object({
    averageNetSalary: z.string().describe("متوسط صافي الراتب خلال الفترة."),
    overtimeAnalysis: z.string().describe("تحليل لاتجاه العمل الإضافي (متزايد، متناقص، مستقر) ومتوسط قيمته."),
    deductionsAnalysis: z.string().describe("ملخص لأي خصومات أو سلف كبيرة أو متكررة خلال الفترة."),
    overallTrend: z.string().describe("وصف للاتجاه العام لصافي الراتب وما إذا كان يتجه للزيادة، النقصان، أو الاستقرار، مع ذكر السبب الرئيسي."),
    recommendation: z.string().describe("توصية أو ملاحظة ذكية بناءً على التحليل."),
});

const PredictSalaryTrendsOutputSchema = z.object({
  trendAnalysis: TrendAnalysisSchema,
});
export type PredictSalaryTrendsOutput = z.infer<typeof PredictSalaryTrendsOutputSchema>;

export async function predictSalaryTrends(input: PredictSalaryTrendsInput): Promise<PredictSalaryTrendsOutput> {
  return predictSalaryTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictSalaryTrendsPrompt',
  input: {schema: PredictSalaryTrendsInputSchema},
  output: {schema: PredictSalaryTrendsOutputSchema},
  prompt: `أنت خبير في تحليل البيانات المالية والموارد البشرية. قم بتحليل بيانات الرواتب التاريخية التالية للموظف "{{employeeName}}" على مدار الـ 6 أشهر الماضية وقدم ملخصًا تحليليًا باللغة العربية.

البيانات التاريخية (JSON):
{{{timeSeriesData}}}

يجب أن يغطي تحليلك النقاط التالية بدقة:
1.  **متوسط صافي الراتب:** قم بحساب وعرض متوسط صافي الراتب خلال الفترة.
2.  **تحليل العمل الإضافي (Overtime):** حلل اتجاهه (هل هو متزايد، متناقص، أم مستقر؟) واذكر متوسط قيمته.
3.  **تحليل الخصومات والسلف:** اذكر أي خصومات (penalties) أو سلف (advances) كبيرة أو متكررة خلال الفترة.
4.  **الاتجاه العام للراتب:** لخص ما إذا كان صافي الراتب يتجه للزيادة، النقصان، أو الاستقرار، واذكر السبب الرئيسي لذلك (مثلاً: بسبب التغير في العمل الإضافي أو الخصومات).
5.  **توصية أو ملاحظة ذكية:** قدم استنتاجًا أو توصية عملية بسيطة بناءً على التحليل (مثال: "قد يكون من المفيد مراجعة أسباب الزيادة المستمرة في العمل الإضافي" أو "يبدو أن السلف تؤثر بشكل كبير على صافي الراتب الشهري").

قدم الإجابة النهائية بصيغة JSON منظمة حسب المخطط المطلوب.`,
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
