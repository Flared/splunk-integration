import { getRedirectUrl } from '../utils/setupConfiguration';

test('Flare Redirect URL', () => {
    expect(getRedirectUrl()).toBe('/app/flare');
});
