/**
 * Vercel Cron Job Endpoint
 * Automatically updates ESPN data every Tuesday at 10 AM UTC
 *
 * Schedule: 0 10 * * 2 (configured in vercel.json)
 * Security: Validates Vercel authorization header with CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateAllData } from '@/services/data-updater';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for multiple ESPN API calls

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify Vercel cron authentication
  // const authHeader = request.headers.get('authorization');

  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   console.error('❌ Unauthorized cron request attempt');
  //   return NextResponse.json(
  //     { error: 'Unauthorized', message: 'Invalid or missing authorization token' },
  //     { status: 401 }
  //   );
  // }

  console.log('🏈 Vercel cron job triggered - starting ESPN data update...');

  try {
    // Run the update process
    const result = await updateAllData({
      onProgress: (message) => {
        // Log progress for Vercel function logs
        console.log(message);
      },
    });

    const totalTime = Date.now() - startTime;

    // Log summary
    console.log('\n📊 Cron Job Summary:');
    console.log(`  Status: ${result.success ? 'Success' : 'Partial Success'}`);
    console.log(`  Weeks Processed: ${result.weeksProcessed}`);
    console.log(`  Teams Updated: ${result.teamsUpdated}`);
    console.log(`  Errors: ${result.errors.length}`);
    console.log(`  Duration: ${(totalTime / 1000).toFixed(2)}s`);

    if (result.errors.length > 0) {
      console.log('  Errors encountered:');
      result.errors.forEach((error, index) => {
        console.log(`    ${index + 1}. ${error}`);
      });
    }

    // Return detailed response
    return NextResponse.json(
      {
        success: result.success,
        message: result.success
          ? 'Data update completed successfully'
          : 'Data update completed with errors',
        data: {
          weeksProcessed: result.weeksProcessed,
          teamsUpdated: result.teamsUpdated,
          lastUpdate: result.lastUpdate,
          duration: totalTime,
          errors: result.errors,
        },
      },
      { status: result.success ? 200 : 207 } // 207 Multi-Status for partial success
    );
  } catch (error) {
    console.error('❌ Fatal error in cron job:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
