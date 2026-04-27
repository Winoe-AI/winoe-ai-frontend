export const DAY1_DESIGN_DOC_STARTER = `# Day 1 Design Document

## Understanding of the Project Brief

Summarize the problem, user needs, key requirements, and constraints in your own words.

## Tech Stack Choice

What tech stack will you use and why? Include the framework, libraries, tools, and dependency choices you plan to use.

## Project Structure

How will you structure the project? Describe the main folders, modules, services, components, or layers you plan to create.

## Architecture & Data Flow

Describe the core architecture, major entities, data flow, API boundaries, and important integration points.

## Key Decisions & Tradeoffs

What decisions are you making now? What alternatives did you consider? What tradeoffs are you accepting?

## Testing Strategy

What is your testing strategy? Include unit, integration, end-to-end, manual, or other validation plans as appropriate.

## Risks & Open Questions

What could go wrong? What assumptions are you making? What will you watch closely during implementation?

## Days 2-3 Implementation Plan

Outline how you will use the two implementation days.
`;

export function getDay1DesignDocInitialValue(dayIndex: number): string {
  return dayIndex === 1 ? DAY1_DESIGN_DOC_STARTER : '';
}
