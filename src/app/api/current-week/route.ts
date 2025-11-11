import { NextResponse } from 'next/server';
import { ESPNApiService } from '@/services/espn-api';

/**
 * GET /api/current-week
 * Returns the current week information from ESPN API
 */
export async function GET() {
  try {
    const espnService = new ESPNApiService();

    // Get current week from ESPN (this returns the ongoing/next week)
    const currentWeek = await espnService.getCurrentWeek();

    // The last completed week is currentWeek - 1
    const lastCompletedWeek = currentWeek - 1;

    return NextResponse.json({
      currentWeek,
      lastCompletedWeek,
      maxWeek: Math.max(1, lastCompletedWeek), // Ensure at least week 1
      totalWeeks: 18, // NFL regular season weeks
    });
  } catch (error) {
    console.error('Error fetching current week:', error);

    // Return a fallback response instead of error
    // This ensures the UI still works even if ESPN API fails
    return NextResponse.json({
      currentWeek: 1,
      lastCompletedWeek: 0,
      maxWeek: 18,
      totalWeeks: 18,
      error: 'Failed to fetch current week, showing all weeks',
    });
  }
}
