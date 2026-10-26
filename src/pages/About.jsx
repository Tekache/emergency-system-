export default function About() {
  return (
    <div className="card prose">
      <h1>About the system</h1>
      <p>The Community Emergency Reporting and Response System gives Tudun Wada a single place to report emergency incidents and to manage and track the response to them.</p>
      <h3>User roles</h3>
      <p><strong>Community users</strong> register, submit reports and follow the status of their own reports. <strong>Responders</strong> review incoming reports, accept incidents, update status and add response notes. <strong>Administrators</strong> oversee all records, create accounts, assign or change account roles, and manage active status.</p>
      <h3>Incident lifecycle</h3>
      <p>Pending, then Accepted, then In Progress, then Resolved. A report can be Cancelled while it is still open. Every change is stored in the incident history.</p>
      <h3>Limitations</h3>
      <p>This is a reporting and tracking platform. It does not automatically contact external emergency agencies, track vehicles or dispatch services. In a life-threatening situation, call 112 directly.</p>
    </div>
  );
}
