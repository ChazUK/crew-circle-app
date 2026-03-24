# Ubiquitous Language

_CrewCircle — UK Film & TV Production Crew Coordination Platform_

---

## People

| Term                   | Definition                                                                                                      | Aliases to avoid           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **Crew Member**        | A user who can both broadcast Jobs to their Circles and receive Job requests from others                        | Worker, freelancer, crew   |
| **Production Manager** | A user type that can only post Jobs and receive the Requester-selected Applicant's details once a Job is filled | PM, producer, coordinator  |
| **Requester**          | The Crew Member who broadcasts a Job to one of their Circles to find a replacement                              | Sender, poster, dispatcher |
| **Applicant**          | A Circle Member who has responded as available to work for a specific Job                                       | Respondent, candidate      |
| **Circle Owner**       | The Crew Member who created and manages a Circle; the only person who can see and manage its membership         | Admin, manager             |
| **Circle Member**      | A Crew Member who has accepted an invitation to belong to a Circle                                              | Member, contact            |

---

## Circles

| Term       | Definition                                                                                  | Aliases to avoid           |
| ---------- | ------------------------------------------------------------------------------------------- | -------------------------- |
| **Circle** | A private, owner-managed group of Crew Members who share the same department or role type   | Group, team, list, network |
| **Invite** | A request sent by a Circle Owner via email or phone number to add a Crew Member to a Circle | Request, link              |

---

## Jobs

| Term                      | Definition                                                                                                  | Aliases to avoid             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **Job**                   | A broadcast request sent to a Circle seeking an available Crew Member to fill a vacant role on a production | Booking, gig, request, shift |
| **Production Title**      | The name or codename of the production associated with a Job                                                | Show name, project name      |
| **Role**                  | The specific crew position required for a Job (e.g. Key Grip, Focus Puller)                                 | Position, title, job title   |
| **Day Rate**              | The offered daily pay rate for a Job, expressed in GBP                                                      | Rate, fee, salary            |
| **Shoot Type**            | Whether a Job takes place indoors or outdoors: `interior` or `exterior`                                     | Location type                |
| **Day Type**              | The working hours pattern for a Job: `day`, `night`, or `split day`                                         | Shift type                   |
| **Job Status**            | The current state of a Job: `open`, `filled`, or `cancelled`                                                | State, stage                 |
| **Availability Response** | A Circle Member's reply to a Job broadcast: `available` or `not available`, optionally with a message       | Application, reply, RSVP     |
| **Location Base**         | The geographic areas a Crew Member is willing to work from or travel to                                     | Work location, base          |

---

## Industry Context

| Term              | Definition                                                                                                                      | Aliases to avoid        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Diary Service** | A third-party paid service where a human operator manages a Crew Member's schedule and puts them forward for short-notice roles | Agency, booking service |

---

## Calendar

| Term              | Definition                                                                                      | Aliases to avoid                |
| ----------------- | ----------------------------------------------------------------------------------------------- | ------------------------------- |
| **Booked Job**    | A Job a Crew Member has been confirmed for; appears on their Calendar                           | Confirmed booking, accepted job |
| **Requested Job** | A Job a Crew Member has been invited to apply for but not yet filled; appears on their Calendar | Pending job, open request       |

---

## Profile

| Term                | Definition                                                                         | Aliases to avoid |
| ------------------- | ---------------------------------------------------------------------------------- | ---------------- |
| **Kit**             | Equipment owned by a Crew Member that is available for use on productions          | Gear, equipment  |
| **Department**      | The broad production area a Crew Member works within (e.g. Camera, Grip, Sound)    | Division, team   |
| **Spoken Language** | A language a Crew Member can communicate in, with an associated fluency level      | Language         |
| **Passport**        | A travel document held by a Crew Member, indicating international work eligibility | Travel document  |

---

## Relationships

- A **Circle** belongs to exactly one **Circle Owner**
- A **Circle** contains one or more **Circle Members**
- A **Circle Member** cannot see other **Circle Members** within the same **Circle**
- A **Job** is broadcast by a **Requester** to exactly one **Circle**
- A **Job** may optionally be assigned a **Production Manager**
- A **Job** receives zero or more **Availability Responses** from **Circle Members**
- An **Applicant** is a **Circle Member** who has submitted an `available` **Availability Response**
- A **Requester** selects exactly one **Applicant** to fill a **Job**, changing its **Job Status** to `filled`
- A **Production Manager** receives the selected **Applicant**'s contact details once a **Job** is `filled`
- A filled **Job** may be re-opened if the selected **Applicant** cannot fulfil it

---

## Example dialogue

> **Dev:** "When a **Requester** broadcasts a **Job** to a **Circle**, do all **Circle Members** get notified?"
> **Domain expert:** "Yes — every **Circle Member** gets a push notification and can submit an **Availability Response**."

> **Dev:** "Once the **Requester** picks someone, do the other **Applicants** get told they weren't selected?"
> **Domain expert:** "Only via the **Job Status** changing to `filled` — no push notification goes out unless they actively responded as available."

> **Dev:** "What if the selected person falls through — does the **Job** reopen?"
> **Domain expert:** "Yes, the **Requester** can reopen the **Job** and the process starts again. The existing **Availability Responses** are still visible."

> **Dev:** "Can a **Circle Member** see who else is in their **Circle**?"
> **Domain expert:** "No. A **Circle** is private to the **Circle Owner**. A **Circle Member** can only remove themselves if they're getting too many notifications."

---

## Flagged ambiguities

- **"Job" vs "Booking"** — "Booking" implies confirmation; in CrewCircle a Job is a broadcast request that may or may not result in a hire. Use **Job** until confirmed, then **Booked Job**.
- **"Production Manager" vs "user type"** — Production Manager is a distinct account type with restricted permissions (post-only), not just a role label on a standard Crew Member profile. Treat as a separate user type.
- **"Circle" vs "Group"** — "Group" is generic and used by every social platform. **Circle** is the canonical term and should be used in all UI copy and code.
- **"Rate"** — could refer to a day rate, hourly rate, or weekly rate. Canonical term is **Day Rate** until other rate types are introduced.
