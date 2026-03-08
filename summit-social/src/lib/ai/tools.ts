import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const chatTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_flights",
      description: "Search for available flights between two airports",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string", description: "Origin IATA airport code (e.g. LHR)" },
          destination: { type: "string", description: "Destination IATA airport code (e.g. KTM)" },
          departureDate: { type: "string", description: "Departure date in YYYY-MM-DD format" },
          returnDate: {
            type: "string",
            description: "Return date in YYYY-MM-DD format (optional)",
          },
          passengers: { type: "number", description: "Number of passengers", default: 1 },
          cabinClass: {
            type: "string",
            enum: ["economy", "premium_economy", "business", "first"],
            default: "economy",
          },
        },
        required: ["origin", "destination", "departureDate"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_adventures",
      description: "Search the SummitSocial adventure database for inspiration",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          category: { type: "string", description: "Adventure category filter" },
          continent: { type: "string", description: "Continent filter" },
          difficulty: { type: "string", description: "Difficulty level filter" },
          maxDuration: { type: "number", description: "Maximum duration in days" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_itinerary_day",
      description: "Add a structured day to the user's itinerary",
      parameters: {
        type: "object",
        properties: {
          dayNumber: { type: "number", description: "Day number in the itinerary" },
          title: { type: "string", description: "Title for this day" },
          description: { type: "string", description: "Brief description of the day" },
          activities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                time: { type: "string" },
                activity: { type: "string" },
                location: { type: "string" },
                notes: { type: "string" },
                lat: { type: "number" },
                lng: { type: "number" },
              },
              required: ["time", "activity", "location"],
            },
          },
        },
        required: ["dayNumber", "title", "activities"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_gear",
      description: "Get gear recommendations for an activity and conditions",
      parameters: {
        type: "object",
        properties: {
          activity: { type: "string", description: "Activity type (e.g. trekking, cycling)" },
          conditions: {
            type: "string",
            description: "Expected conditions (e.g. cold, wet, high altitude)",
          },
          duration: { type: "number", description: "Duration in days" },
        },
        required: ["activity", "conditions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weather_forecast",
      description: "Get historical weather data for a destination and month",
      parameters: {
        type: "object",
        properties: {
          destination: { type: "string", description: "Destination name" },
          month: { type: "number", description: "Month number (1-12)" },
        },
        required: ["destination", "month"],
      },
    },
  },
];
