import { Component, OnInit, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Template } from './templates.model';
import { TemplateService } from './template.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.css'],
  providers: [TemplateService]
})
export class TemplatesComponent implements OnInit {

  constructor(private http: HttpClient, private tService: TemplateService, private renderer: Renderer2) { }
  httpURL: String = 'http://localhost:10010/ne';
  templates: Template[];
  template: Template;
  showFormPopup: boolean = false;
  showTemplate: Template = null;
  searchString: string;
  recordsPerPage: number = 6;
  isLoading: boolean;
  templateForm: FormGroup;
  isModified: boolean = false;
  isAlert: boolean = false;
  ngOnInit() {
    this.getTemplates(`?sort=_id&page=1&count=${this.recordsPerPage}`);
    this.tService.getEntities();

  }

  getTemplates(param) {
    this.isLoading = true;
    this.doRESTcall('GET', '', param).subscribe(data => {
      this.templates = data;
      this.showTemplate = this.templates[0];
      this.isLoading = false;
    },
      err => {
        console.log('HTTP Error' + err);
      });
  }

  postTemplate(template: Template) {
    const body = template;
    this.closePopup();
    this.doRESTcall('POST', body, '').subscribe(data => {
      this.getTemplates(`?sort=_id&page=1&count=${this.recordsPerPage}`);
      // console.log(data);
    });
  }

  putTemplate(template: Template) {
    const body = template;
    this.closePopup();
    this.doRESTcall('PUT', body, '/' + template._id).subscribe(data => {
      this.getTemplates(`?sort=_id&page=1&count=${this.recordsPerPage}`);
      // console.log(data);
    });
  }

  deleteTemplate(template: Template) {
    const body = template;
    this.doRESTcall('DELETE', body, '/' + template._id).subscribe(data => {
      this.getTemplates(`?sort=_id&page=1&count=${this.recordsPerPage}`);
    });
  }

  doRESTcall(method, body, param): Observable<any> {
    return this.http.request(method, this.httpURL + '/template' + param, {
      headers: {
        'Content-Type': 'application/json'
      },
      body: body,
      params: param
    });
  }
  showDetails(template: Template) {
    this.showTemplate = template;
  }
  showForm(template: Template, isNewForm: boolean) {
    this.renderer.addClass(document.body, 'modal-open');
    this.showFormPopup = true;
    this.template = !isNewForm ? template : new Template();
    this.setForm(isNewForm);
    this.onFormChanges();
    // console.log(this.template);
  }


  searchForTemplate() {
    // console.log(this.searchString);
    if (this.searchString !== '') {
      let filters = `filter={"name":"/${this.searchString}/"}&sort=_id`;
      this.doRESTcall('GET', '', '?' + filters).subscribe(data => {
        this.templates = data;
      });
    } else {
      this.getTemplates(`?sort=_id&page=1&count=${this.recordsPerPage}`);
    }
  }

  clearSearch() {
    this.searchString = '';
    this.getTemplates(`?sort=_id&page=1&count=${this.recordsPerPage}`);
  }


  //** Template form functions 
  onFormChanges() {
    let sub = this.templateForm.valueChanges.subscribe(val => {
      this.isModified = true;
      sub.unsubscribe();
    });
  }

  setForm(isNew: boolean) {
    this.templateForm = new FormGroup({
      'name': new FormControl(null, Validators.required),
      'type': new FormControl('sms', Validators.required),
      'subject': new FormControl({ value: null, disabled: true }, Validators.required),
      'body': new FormControl(null, Validators.required),
      'isGroupMailer': new FormControl(false)
    });
    if (!isNew) {
      this.templateForm.setValue({
        'name': this.template.name,
        'type': this.template.type,
        'subject': this.template.subject || null,
        'body': this.template.body,
        'isGroupMailer': this.template.isGroupMailer
      });

      !this.template.subject ?
        this.templateForm.controls.subject.disable() : this.templateForm.controls.subject.enable();
    }
  }

  onSubmit() {
    let formValue: Template = this.templateForm.value;
    if (this.templateForm.value['type'] === 'sms') { formValue.subject = ''; }
    if (this.template.hasOwnProperty('_id')) {
      formValue._id = this.template._id;
      this.putTemplate(formValue);
    } else {
      this.postTemplate(formValue);
    }
    this.templateForm.reset();
  }

  onTypeChange(value) {
    // console.log(value);
    if (value === 'email') {
      this.templateForm.controls.subject.enable();
    } else {
      this.templateForm.controls.subject.disable();
      this.templateForm.patchValue({ 'subject': null });
    }
  }
  showAlert() {
    this.isModified ? this.isAlert = true : this.closePopup();
  }

  closePopup() {
    this.renderer.removeClass(document.body, 'modal-open');
    this.isAlert = this.isModified = this.showFormPopup = false;
    this.template = null;
  }

  // Form ends

}
