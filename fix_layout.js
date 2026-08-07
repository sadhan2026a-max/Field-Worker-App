const fs = require('fs');
let content = fs.readFileSync('src/app/_layout.tsx', 'utf8');

const regex = /const responseListener = NotificationService\.addNotificationResponseReceivedListener\(\(response\) => \{\s*logger\.info\('notification', 'Notification clicked', \{\s*actionId: response\.actionIdentifier\s*\}\);\s*\}\);/;

const replacement = `    const responseListener = NotificationService.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      logger.info('notification', 'Notification clicked', {
        actionId: response.actionIdentifier,
        data: data
      });

      const orderId = data?.relatedOrderId || data?.orderId || data?.assignmentId || data?.id;
      if (orderId) {
        // Navigate to the assignment details screen. Small delay to ensure router is ready.
        setTimeout(() => {
          router.push({ pathname: '/assignment/[id]', params: { id: String(orderId) } });
        }, 300);
      }
    });`;

if (regex.test(content)) {
    console.log("Match found! Replacing...");
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/app/_layout.tsx', content);
} else {
    console.log("No match found!");
}
