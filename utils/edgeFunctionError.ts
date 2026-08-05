import { FunctionsHttpError } from "@supabase/supabase-js";

/**
 * `supabase.functions.invoke()` turns any non-2xx Edge Function response into
 * a `FunctionsHttpError` whose `.message` is always the generic "Edge
 * Function returned a non-2xx status code" — the JSON body the function
 * actually sent (e.g. `{ error: "5 students still enrolled" }`) is only
 * reachable via `.context`, a `Response` that has to be read separately.
 * This pulls the real message out so callers can show it instead of the
 * useless generic one.
 */
export const getEdgeFunctionErrorMessage = async (
    error: any,
    fallback: string
): Promise<string> => {
    if (error instanceof FunctionsHttpError) {
        try {
            const body = await error.context.json();
            if (body?.error) return body.error;
        } catch {
            // Response body wasn't JSON — fall through to the generic message.
        }
    }
    return error?.message || fallback;
};
