-- «Компас рекрутера»: расширение enum-ов под безопасный набор действий.
-- Новая миграция, не правит 0001.

alter table recruiter_compass.candidate_reviews
  drop constraint candidate_reviews_recommendation_check;

alter table recruiter_compass.candidate_reviews
  add constraint candidate_reviews_recommendation_check
  check (recommendation in ('continue', 'clarify', 'not_for_current_vacancy', 'consider_neighbour_role'));

alter table recruiter_compass.action_proposals
  drop constraint action_proposals_action_type_check;

alter table recruiter_compass.action_proposals
  add constraint action_proposals_action_type_check
  check (action_type in (
    'advance_candidate',
    'transfer_to_neighbouring_vacancy',
    'prepare_candidate_message',
    'schedule_interview',
    'create_reminder',
    'add_comment',
    'assign_recruiter'
  ));
