export const navigateToStage = (router: any, stagePath: string, poNumber: string) => {
  if (!poNumber) return;
  const encodedPO = encodeURIComponent(poNumber);
  const cleanPath = stagePath.startsWith('/') ? stagePath : `/${stagePath}`;
  router.push(`${cleanPath}?po_number=${encodedPO}`);
};
