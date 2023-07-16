/**
 * Returns a generic message that the contents of a page require sign-in
 * with additional permissions
 *
 * @param facultyAllowed Whether the "unauthorized" screen should say that
 * both faculty and administrators are allowed to view the page content (as
 * opposed to only administrators)
 */
export function unauthorizedScreen(facultyAllowed=false) {
    return <>
        <h1>Unauthorized</h1>
        <h3>Access to this page requires that you sign in as
            {facultyAllowed ? ' a faculty member or ' : ' an '}
            administrator.</h3>
    </>;
}


/**
 * Returns a message stating that page contents are restricted to internal
 * organization members
 */
export function internalMemberOnlyScreen() {
    return <>
        <h1>Unauthorized</h1>
        <h3>Access to this page is restricted to internal
            organization members.</h3>
    </>;
}
