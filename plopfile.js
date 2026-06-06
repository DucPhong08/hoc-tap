const pluralize = require('pluralize');

module.exports = function (plop) {
  // Custom helpers for pluralization
  plop.setHelper('singularize', (text) => pluralize.singular(text));
  plop.setHelper('pluralize', (text) => pluralize.plural(text));

  plop.setGenerator('module', {
    description: 'Tạo một Module NestJS chuẩn theo Base Architecture',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message:
          'Tên của resource là gì? (Ví dụ: product, order_item, user_profile)',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/modules/{{kebabCase (pluralize name)}}/{{kebabCase (pluralize name)}}.module.ts',
        templateFile: 'nest-templates/module/module.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/modules/{{kebabCase (pluralize name)}}/controllers/{{kebabCase (singularize name)}}.controller.ts',
        templateFile: 'nest-templates/module/controller.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/modules/{{kebabCase (pluralize name)}}/services/{{kebabCase (singularize name)}}.service.ts',
        templateFile: 'nest-templates/module/service.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/modules/{{kebabCase (pluralize name)}}/repositories/{{kebabCase (singularize name)}}.repository.ts',
        templateFile: 'nest-templates/module/repository.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/modules/{{kebabCase (pluralize name)}}/entities/{{kebabCase (singularize name)}}.entity.ts',
        templateFile: 'nest-templates/module/entity.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/modules/{{kebabCase (pluralize name)}}/dto/{{kebabCase (singularize name)}}-condition.dto.ts',
        templateFile: 'nest-templates/module/condition.dto.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/modules/{{kebabCase (pluralize name)}}/dto/create-{{kebabCase (singularize name)}}.dto.ts',
        templateFile: 'nest-templates/module/create-dto.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/modules/{{kebabCase (pluralize name)}}/dto/update-{{kebabCase (singularize name)}}.dto.ts',
        templateFile: 'nest-templates/module/update-dto.ts.hbs',
      },
    ],
  });
};
