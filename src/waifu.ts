import { env } from './lib/safeEnv.ts';
import { error } from './lib/error.ts';
import { timeoutFetch } from './lib/util.ts';

const URL = 'https://waifu.neoforged.net/api/graphql';

const thisIsAnExWAIFU = "This WAIFU is not pining, it's passed on. This WAIFU is no more. It has ceased to be. It's expired and gone to meet its maker. This is a late WAIFU. It's a stiff. Bereft of life, it rests in peace. If you hadn't nailed it to the database, it would be pushing up the daisies. It's run down the curtain and joined the choir invisible. This is an ex-WAIFU";


/**
 * Query WAIFU's GraphQL API
 * @param q The properly formed GraphQL query to run
 * @param variables The variables for the query
 * @returns A promise holding either the data result, or a string describing an error that is safe to display to the user.
 */
export const query = async <T extends object>(q: string, variables: Record<string, any> = {}): Promise<T | string> => {
	const response = await timeoutFetch(URL, 25_000, {
		method: 'POST',
		headers: {
			Authorization: env().WAIFU_TOKEN,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify({
			query: q,
			variables: variables,
		}),
	});
	if (response.status !== 200) {
		error(
			'WAIFU',
			`Unknown status code received: ${response.status} [${response.statusText}]. Body: ${await response.text().catch(() => '')}`,
		);
		return `ErrorType: Status ${response.status}\n` + thisIsAnExWAIFU;
	}

	const body = (await response.json().catch(() => ({ error: 'Response is not JSON.' }))) as {
		error?: string;
		errors?: { message: string }[];
		data: object;
	};
	if (body.errors !== undefined) {
		return `WAIFU returned error(s): ${body.errors.map(({ message }) => message).join('\n')}`;
	} else if (body.error !== undefined) {
		return `WAIFU returned error: ${body.error}`;
	} else if ('data' in body) {
		return body['data'] as T;
	}
	error('WAIFU', 'Unknown GraphQL response: ' + JSON.stringify(body));
	return 'ErrorType: UnknownResponse\n' + thisIsAnExWAIFU;
};
