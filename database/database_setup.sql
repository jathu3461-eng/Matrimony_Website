-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `permissions_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,

    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `account_type` ENUM('individual', 'broker', 'admin', 'moderator') NOT NULL DEFAULT 'individual',
    `is_email_verified` BOOLEAN NOT NULL DEFAULT true,
    `is_phone_verified` BOOLEAN NOT NULL DEFAULT true,
    `is_approved` BOOLEAN NOT NULL DEFAULT true,
    `is_suspended` BOOLEAN NOT NULL DEFAULT false,
    `ui_language` VARCHAR(5) NOT NULL DEFAULT 'en',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_number_key`(`phone_number`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_phone_number_idx`(`phone_number`),
    INDEX `users_account_type_idx`(`account_type`),
    INDEX `users_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `user_id` INTEGER NOT NULL,
    `role_id` INTEGER NOT NULL,
    `granted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `refresh_token` VARCHAR(512) NOT NULL,
    `device_name` VARCHAR(100) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `is_revoked` BOOLEAN NOT NULL DEFAULT false,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessions_refresh_token_key`(`refresh_token`),
    INDEX `sessions_user_id_idx`(`user_id`),
    INDEX `sessions_refresh_token_idx`(`refresh_token`),
    INDEX `sessions_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `identifier` VARCHAR(255) NOT NULL,
    `otp_hash` VARCHAR(255) NOT NULL,
    `purpose` VARCHAR(50) NOT NULL,
    `attempt_count` INTEGER NOT NULL DEFAULT 0,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `otp_codes_identifier_idx`(`identifier`),
    INDEX `otp_codes_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `broker_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `agency_name` VARCHAR(200) NULL,
    `license_number` VARCHAR(100) NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `max_profile_quota` INTEGER NOT NULL DEFAULT 10,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `broker_profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `religions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name_en` VARCHAR(100) NOT NULL,
    `name_ta` VARCHAR(100) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 999,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `religions_name_en_key`(`name_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `castes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `religion_id` INTEGER NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `name_ta` VARCHAR(100) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 999,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `castes_religion_id_name_en_key`(`religion_id`, `name_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_castes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `caste_id` INTEGER NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `name_ta` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `sub_castes_caste_id_name_en_key`(`caste_id`, `name_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `raasis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name_en` VARCHAR(100) NOT NULL,
    `name_ta` VARCHAR(100) NOT NULL,
    `numeral_code` INTEGER NOT NULL,

    UNIQUE INDEX `raasis_name_en_key`(`name_en`),
    UNIQUE INDEX `raasis_numeral_code_key`(`numeral_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stars` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name_en` VARCHAR(100) NOT NULL,
    `name_ta` VARCHAR(100) NOT NULL,
    `numeral_code` INTEGER NOT NULL,
    `raasi_id` INTEGER NULL,

    UNIQUE INDEX `stars_name_en_key`(`name_en`),
    UNIQUE INDEX `stars_numeral_code_key`(`numeral_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `countries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `iso2` VARCHAR(2) NOT NULL,
    `iso3` VARCHAR(3) NOT NULL,
    `nameEn` VARCHAR(100) NOT NULL,
    `name_ta` VARCHAR(100) NULL,
    `dialing_code` VARCHAR(10) NULL,
    `priority` INTEGER NOT NULL DEFAULT 999,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `countries_iso2_key`(`iso2`),
    UNIQUE INDEX `countries_iso3_key`(`iso3`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `states` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `country_id` INTEGER NOT NULL,
    `nameEn` VARCHAR(100) NOT NULL,
    `name_ta` VARCHAR(100) NULL,

    INDEX `states_country_id_idx`(`country_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `state_id` INTEGER NOT NULL,
    `nameEn` VARCHAR(100) NOT NULL,
    `name_ta` VARCHAR(100) NULL,

    INDEX `cities_state_id_idx`(`state_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mother_tongues` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name_en` VARCHAR(100) NOT NULL,
    `name_ta` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `mother_tongues_name_en_key`(`name_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `education_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name_en` VARCHAR(100) NOT NULL,
    `name_ta` VARCHAR(100) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 999,

    UNIQUE INDEX `education_categories_name_en_key`(`name_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `education_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NOT NULL,
    `name_en` VARCHAR(200) NOT NULL,
    `name_ta` VARCHAR(200) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `occupation_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name_en` VARCHAR(100) NOT NULL,
    `name_ta` VARCHAR(100) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 999,

    UNIQUE INDEX `occupation_categories_name_en_key`(`name_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `occupation_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NOT NULL,
    `name_en` VARCHAR(200) NOT NULL,
    `name_ta` VARCHAR(200) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `profile_registered_for` ENUM('self', 'son', 'daughter', 'brother', 'sister', 'relative', 'friend', 'client') NOT NULL,
    `status` ENUM('draft', 'pending_moderation', 'active', 'suspended', 'deactivated', 'archived') NOT NULL DEFAULT 'draft',
    `name` VARCHAR(100) NOT NULL,
    `gender` ENUM('M', 'F') NOT NULL,
    `date_of_birth` DATE NOT NULL,
    `marital_status` ENUM('never_married', 'divorced', 'widowed', 'separated', 'annulled') NOT NULL DEFAULT 'never_married',
    `height_cm` INTEGER NOT NULL,
    `weight_kg` INTEGER NULL,
    `body_type` ENUM('slim', 'athletic', 'average', 'heavy') NULL,
    `complexion` ENUM('very_fair', 'fair', 'wheatish', 'dark', 'very_dark') NULL,
    `mother_tongue_id` INTEGER NULL,
    `education_category_id` INTEGER NULL,
    `education_detail_id` INTEGER NULL,
    `occupation_category_id` INTEGER NULL,
    `occupation_detail_id` INTEGER NULL,
    `annual_income` ENUM('below_20k', 'range_20k_40k', 'range_40k_60k', 'range_60k_100k', 'range_100k_150k', 'above_150k') NULL,
    `religion_id` INTEGER NOT NULL,
    `caste_id` INTEGER NOT NULL,
    `sub_caste_id` INTEGER NULL,
    `raasi_id` INTEGER NOT NULL,
    `star_id` INTEGER NOT NULL,
    `gotram` VARCHAR(100) NULL,
    `born_country_id` INTEGER NOT NULL,
    `current_country_id` INTEGER NOT NULL,
    `current_state_id` INTEGER NULL,
    `current_city_id` INTEGER NULL,
    `city_or_state` VARCHAR(100) NOT NULL,
    `main_profile_picture` VARCHAR(500) NULL,
    `about_me` TEXT NOT NULL,
    `is_manglik` BOOLEAN NULL,
    `profile_view_count` INTEGER NOT NULL DEFAULT 0,
    `is_profile_complete` BOOLEAN NOT NULL DEFAULT false,
    `moderator_note` TEXT NULL,
    `approved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `profiles_gender_religion_id_caste_id_current_country_id_stat_idx`(`gender`, `religion_id`, `caste_id`, `current_country_id`, `status`),
    INDEX `profiles_raasi_id_star_id_idx`(`raasi_id`, `star_id`),
    INDEX `profiles_date_of_birth_idx`(`date_of_birth`),
    INDEX `profiles_height_cm_idx`(`height_cm`),
    INDEX `profiles_marital_status_idx`(`marital_status`),
    INDEX `profiles_education_category_id_idx`(`education_category_id`),
    INDEX `profiles_annual_income_idx`(`annual_income`),
    INDEX `profiles_user_id_idx`(`user_id`),
    INDEX `profiles_status_idx`(`status`),
    INDEX `profiles_deleted_at_idx`(`deleted_at`),
    FULLTEXT INDEX `profiles_name_about_me_idx`(`name`, `about_me`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profile_id` INTEGER NOT NULL,
    `photo_url` VARCHAR(500) NOT NULL,
    `thumbnail_url` VARCHAR(500) NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `is_main` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `moderated_at` DATETIME(3) NULL,
    `moderator_id` INTEGER NULL,

    INDEX `photos_profile_id_status_idx`(`profile_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profile_id` INTEGER NOT NULL,
    `document_type` ENUM('horoscope', 'birth_certificate', 'id_proof') NOT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `file_type` ENUM('image', 'pdf') NOT NULL,
    `status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `verified_at` DATETIME(3) NULL,
    `verified_by_id` INTEGER NULL,

    INDEX `profile_documents_profile_id_idx`(`profile_id`),
    INDEX `profile_documents_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lifestyles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profile_id` INTEGER NOT NULL,
    `diet` ENUM('vegetarian', 'non_vegetarian', 'vegan', 'eggetarian', 'jain') NULL,
    `drinking` ENUM('never', 'occasionally', 'regularly') NULL,
    `smoking` ENUM('never', 'occasionally', 'regularly') NULL,
    `physical_activity` VARCHAR(100) NULL,
    `hobbies` JSON NULL,
    `languages` JSON NULL,

    UNIQUE INDEX `lifestyles_profile_id_key`(`profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `family_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profile_id` INTEGER NOT NULL,
    `father_name` VARCHAR(100) NULL,
    `father_occupation` VARCHAR(150) NULL,
    `mother_name` VARCHAR(100) NULL,
    `mother_occupation` VARCHAR(150) NULL,
    `num_brothers` INTEGER NULL,
    `num_married_brothers` INTEGER NULL,
    `num_sisters` INTEGER NULL,
    `num_married_sisters` INTEGER NULL,
    `family_status` ENUM('rich', 'upper_middle_class', 'middle_class', 'working_class') NULL,
    `family_values` ENUM('traditional', 'moderate', 'liberal') NULL,
    `family_origin_city` VARCHAR(100) NULL,
    `family_origin_country_id` INTEGER NULL,
    `additional_info` TEXT NULL,

    UNIQUE INDEX `family_details_profile_id_key`(`profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partner_preferences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profile_id` INTEGER NOT NULL,
    `min_age` INTEGER NULL,
    `max_age` INTEGER NULL,
    `min_height_cm` INTEGER NULL,
    `max_height_cm` INTEGER NULL,
    `marital_statuses` JSON NULL,
    `diet` ENUM('vegetarian', 'non_vegetarian', 'vegan', 'eggetarian', 'jain') NULL,
    `smoking` ENUM('never', 'occasionally', 'regularly') NULL,
    `drinking` ENUM('never', 'occasionally', 'regularly') NULL,
    `income_min` ENUM('below_20k', 'range_20k_40k', 'range_40k_60k', 'range_60k_100k', 'range_100k_150k', 'above_150k') NULL,
    `other_notes` TEXT NULL,

    UNIQUE INDEX `partner_preferences_profile_id_key`(`profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partner_preference_castes` (
    `preference_id` INTEGER NOT NULL,
    `caste_id` INTEGER NOT NULL,

    PRIMARY KEY (`preference_id`, `caste_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partner_preference_countries` (
    `preference_id` INTEGER NOT NULL,
    `country_id` INTEGER NOT NULL,

    PRIMARY KEY (`preference_id`, `country_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sender_profile_id` INTEGER NOT NULL,
    `receiver_profile_id` INTEGER NOT NULL,
    `status` ENUM('pending', 'accepted', 'rejected', 'expired', 'withdrawn') NOT NULL DEFAULT 'pending',
    `message_note` VARCHAR(500) NULL,
    `responded_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `interests_receiver_profile_id_status_idx`(`receiver_profile_id`, `status`),
    INDEX `interests_sender_profile_id_status_idx`(`sender_profile_id`, `status`),
    UNIQUE INDEX `interests_sender_profile_id_receiver_profile_id_key`(`sender_profile_id`, `receiver_profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `profile_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `favorites_user_id_idx`(`user_id`),
    UNIQUE INDEX `favorites_user_id_profile_id_key`(`user_id`, `profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blocks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `blocker_user_id` INTEGER NOT NULL,
    `blocked_user_id` INTEGER NOT NULL,
    `reason` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `blocks_blocker_user_id_idx`(`blocker_user_id`),
    UNIQUE INDEX `blocks_blocker_user_id_blocked_user_id_key`(`blocker_user_id`, `blocked_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recent_views` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `viewer_user_id` INTEGER NOT NULL,
    `viewed_profile_id` INTEGER NOT NULL,
    `viewed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `recent_views_viewed_profile_id_idx`(`viewed_profile_id`),
    INDEX `recent_views_viewer_user_id_idx`(`viewer_user_id`),
    INDEX `recent_views_viewed_at_idx`(`viewed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `compatibility_scores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profile_id` INTEGER NOT NULL,
    `target_profile_id` INTEGER NOT NULL,
    `overall_score` INTEGER NOT NULL,
    `astro_score` INTEGER NULL,
    `location_score` INTEGER NULL,
    `culture_score` INTEGER NULL,
    `highlights` JSON NULL,
    `flags` JSON NULL,
    `computed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `compatibility_scores_profile_id_overall_score_idx`(`profile_id`, `overall_score`),
    UNIQUE INDEX `compatibility_scores_profile_id_target_profile_id_key`(`profile_id`, `target_profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `last_message_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `conversations_last_message_at_idx`(`last_message_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversation_participants` (
    `conversation_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_read_at` DATETIME(3) NULL,

    INDEX `conversation_participants_user_id_idx`(`user_id`),
    PRIMARY KEY (`conversation_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversation_id` INTEGER NOT NULL,
    `sender_id` INTEGER NOT NULL,
    `message_text` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `deleted_by_sender` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `messages_conversation_id_created_at_idx`(`conversation_id`, `created_at`),
    INDEX `messages_sender_id_idx`(`sender_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('interest_received', 'interest_accepted', 'interest_rejected', 'new_message', 'profile_viewed', 'payment_success', 'payment_failed', 'membership_expiring', 'photo_approved', 'photo_rejected', 'profile_approved', 'profile_suspended', 'system_announcement') NOT NULL,
    `title_en` VARCHAR(200) NOT NULL,
    `title_ta` VARCHAR(200) NULL,
    `body_en` TEXT NOT NULL,
    `body_ta` TEXT NULL,
    `reference_id` INTEGER NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_is_read_idx`(`user_id`, `is_read`),
    INDEX `notifications_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `membership_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'CAD',
    `duration_days` INTEGER NOT NULL,
    `features` JSON NOT NULL,
    `highlight_features` JSON NULL,
    `max_interests_daily` INTEGER NULL,
    `max_messages_daily` INTEGER NULL,
    `can_view_contacts` BOOLEAN NOT NULL DEFAULT false,
    `can_view_horoscope` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 999,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `membership_plans_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_memberships` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `plan_id` INTEGER NOT NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `status` ENUM('active', 'expired', 'cancelled', 'paused') NOT NULL DEFAULT 'active',
    `auto_renew` BOOLEAN NOT NULL DEFAULT false,
    `cancelled_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `user_memberships_user_id_status_idx`(`user_id`, `status`),
    INDEX `user_memberships_ends_at_idx`(`ends_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `membership_id` INTEGER NULL,
    `transaction_reference` VARCHAR(255) NOT NULL,
    `gateway` VARCHAR(50) NOT NULL,
    `gateway_payment_id` VARCHAR(255) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'CAD',
    `tax_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `payment_method` VARCHAR(50) NOT NULL,
    `status` ENUM('pending', 'succeeded', 'failed', 'refunded', 'disputed') NOT NULL DEFAULT 'pending',
    `failure_reason` VARCHAR(255) NULL,
    `refunded_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payments_transaction_reference_key`(`transaction_reference`),
    INDEX `payments_user_id_idx`(`user_id`),
    INDEX `payments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payment_id` INTEGER NOT NULL,
    `invoice_number` VARCHAR(100) NOT NULL,
    `invoice_pdf_url` VARCHAR(500) NULL,
    `issued_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `invoices_payment_id_key`(`payment_id`),
    UNIQUE INDEX `invoices_invoice_number_key`(`invoice_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reporter_user_id` INTEGER NOT NULL,
    `reported_profile_id` INTEGER NOT NULL,
    `reason` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('pending', 'investigating', 'actioned', 'dismissed') NOT NULL DEFAULT 'pending',
    `moderator_id` INTEGER NULL,
    `moderator_note` TEXT NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reports_status_idx`(`status`),
    INDEX `reports_reported_profile_id_idx`(`reported_profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_tickets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `status` ENUM('open', 'in_progress', 'waiting_on_user', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    `priority` VARCHAR(20) NOT NULL DEFAULT 'normal',
    `assigned_to_id` INTEGER NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `support_tickets_user_id_idx`(`user_id`),
    INDEX `support_tickets_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticket_id` INTEGER NOT NULL,
    `sender_id` INTEGER NOT NULL,
    `body` TEXT NOT NULL,
    `is_staff` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ticket_messages_ticket_id_idx`(`ticket_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `author_id` INTEGER NULL,
    `slug` VARCHAR(200) NOT NULL,
    `title_en` VARCHAR(255) NOT NULL,
    `title_ta` VARCHAR(255) NULL,
    `body_en` LONGTEXT NOT NULL,
    `body_ta` LONGTEXT NULL,
    `meta_description` VARCHAR(300) NULL,
    `featured_image` VARCHAR(500) NULL,
    `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_posts_slug_key`(`slug`),
    INDEX `blog_posts_status_published_at_idx`(`status`, `published_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_tags` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `blog_tags_name_key`(`name`),
    UNIQUE INDEX `blog_tags_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_post_tags` (
    `post_id` INTEGER NOT NULL,
    `tag_id` INTEGER NOT NULL,

    PRIMARY KEY (`post_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faqs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NULL,
    `question_en` VARCHAR(500) NOT NULL,
    `question_ta` VARCHAR(500) NULL,
    `answer_en` TEXT NOT NULL,
    `answer_ta` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 999,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `faqs_category_id_idx`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parent_id` INTEGER NULL,
    `title_en` VARCHAR(100) NOT NULL,
    `title_ta` VARCHAR(100) NOT NULL,
    `target_url` VARCHAR(255) NOT NULL,
    `icon` VARCHAR(100) NULL,
    `display_order` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(150) NOT NULL,
    `value` TEXT NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'string',
    `description` VARCHAR(255) NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT false,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action_type` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(100) NULL,
    `entity_id` INTEGER NULL,
    `description` TEXT NOT NULL,
    `old_value` JSON NULL,
    `new_value` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_action_type_idx`(`action_type`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `security_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `severity` VARCHAR(20) NOT NULL DEFAULT 'info',
    `ip_address` VARCHAR(45) NOT NULL,
    `user_agent` VARCHAR(500) NULL,
    `description` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `security_events_user_id_idx`(`user_id`),
    INDEX `security_events_ip_address_idx`(`ip_address`),
    INDEX `security_events_event_type_idx`(`event_type`),
    INDEX `security_events_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `broker_profiles` ADD CONSTRAINT `broker_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `castes` ADD CONSTRAINT `castes_religion_id_fkey` FOREIGN KEY (`religion_id`) REFERENCES `religions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_castes` ADD CONSTRAINT `sub_castes_caste_id_fkey` FOREIGN KEY (`caste_id`) REFERENCES `castes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `states` ADD CONSTRAINT `states_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cities` ADD CONSTRAINT `cities_state_id_fkey` FOREIGN KEY (`state_id`) REFERENCES `states`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `education_details` ADD CONSTRAINT `education_details_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `education_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `occupation_details` ADD CONSTRAINT `occupation_details_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `occupation_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_religion_id_fkey` FOREIGN KEY (`religion_id`) REFERENCES `religions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_caste_id_fkey` FOREIGN KEY (`caste_id`) REFERENCES `castes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_sub_caste_id_fkey` FOREIGN KEY (`sub_caste_id`) REFERENCES `sub_castes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_raasi_id_fkey` FOREIGN KEY (`raasi_id`) REFERENCES `raasis`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_star_id_fkey` FOREIGN KEY (`star_id`) REFERENCES `stars`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_mother_tongue_id_fkey` FOREIGN KEY (`mother_tongue_id`) REFERENCES `mother_tongues`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_education_category_id_fkey` FOREIGN KEY (`education_category_id`) REFERENCES `education_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_education_detail_id_fkey` FOREIGN KEY (`education_detail_id`) REFERENCES `education_details`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_occupation_category_id_fkey` FOREIGN KEY (`occupation_category_id`) REFERENCES `occupation_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_occupation_detail_id_fkey` FOREIGN KEY (`occupation_detail_id`) REFERENCES `occupation_details`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_born_country_id_fkey` FOREIGN KEY (`born_country_id`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_current_country_id_fkey` FOREIGN KEY (`current_country_id`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_current_state_id_fkey` FOREIGN KEY (`current_state_id`) REFERENCES `states`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_current_city_id_fkey` FOREIGN KEY (`current_city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos` ADD CONSTRAINT `photos_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile_documents` ADD CONSTRAINT `profile_documents_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lifestyles` ADD CONSTRAINT `lifestyles_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_details` ADD CONSTRAINT `family_details_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_preferences` ADD CONSTRAINT `partner_preferences_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_preference_castes` ADD CONSTRAINT `partner_preference_castes_preference_id_fkey` FOREIGN KEY (`preference_id`) REFERENCES `partner_preferences`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_preference_castes` ADD CONSTRAINT `partner_preference_castes_caste_id_fkey` FOREIGN KEY (`caste_id`) REFERENCES `castes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_preference_countries` ADD CONSTRAINT `partner_preference_countries_preference_id_fkey` FOREIGN KEY (`preference_id`) REFERENCES `partner_preferences`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_preference_countries` ADD CONSTRAINT `partner_preference_countries_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interests` ADD CONSTRAINT `interests_sender_profile_id_fkey` FOREIGN KEY (`sender_profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interests` ADD CONSTRAINT `interests_receiver_profile_id_fkey` FOREIGN KEY (`receiver_profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blocks` ADD CONSTRAINT `blocks_blocker_user_id_fkey` FOREIGN KEY (`blocker_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blocks` ADD CONSTRAINT `blocks_blocked_user_id_fkey` FOREIGN KEY (`blocked_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recent_views` ADD CONSTRAINT `recent_views_viewer_user_id_fkey` FOREIGN KEY (`viewer_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recent_views` ADD CONSTRAINT `recent_views_viewed_profile_id_fkey` FOREIGN KEY (`viewed_profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compatibility_scores` ADD CONSTRAINT `compatibility_scores_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_participants` ADD CONSTRAINT `conversation_participants_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_participants` ADD CONSTRAINT `conversation_participants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_memberships` ADD CONSTRAINT `user_memberships_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_memberships` ADD CONSTRAINT `user_memberships_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `membership_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `user_memberships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporter_user_id_fkey` FOREIGN KEY (`reporter_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reported_profile_id_fkey` FOREIGN KEY (`reported_profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_messages` ADD CONSTRAINT `ticket_messages_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_messages` ADD CONSTRAINT `ticket_messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_post_tags` ADD CONSTRAINT `blog_post_tags_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_post_tags` ADD CONSTRAINT `blog_post_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `blog_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `menu_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

